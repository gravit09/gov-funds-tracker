// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GovernmentFunds {
    struct Entity {
        bool isActive;
        mapping(address => uint256) votes;
        uint256 totalVotes;
        uint256 toBeSpent;
        uint256 balance;
    }

    struct SpendingRecord {
        uint256 id;
        address entity;
        uint256 amount;
        uint256 timestamp;
    }

    struct Tender {
        uint256 id;
        string title;
        string description;
        uint256 amount;
        uint256 deadline;
        address issuer;
        bool isActive;
        address winner;
        uint256 winningBid;
        uint256 minBidAmount;
        uint256 maxBidAmount;
        uint256 bidCount;
    }

    struct Bid {
        uint256 id;
        address bidder;
        uint256 amount;
        uint256 timestamp;
        bool isWithdrawn;
    }

    mapping(address => Entity) public entities;
    mapping(address => mapping(address => bool)) public hasVoted;
    mapping(uint256 => SpendingRecord) public spendingRecords;
    mapping(uint256 => Tender) public tenders;
    mapping(uint256 => mapping(uint256 => Bid)) public bids; // tenderId => bidId => Bid
    mapping(uint256 => uint256) public tenderBidCount; // tenderId => number of bids
    uint256 public spendingCount;
    uint256 public tenderCount;

    event Voted(address indexed voter, address indexed entity);
    event SpendingRecorded(uint256 indexed id, address indexed entity, uint256 amount);
    event TenderIssued(uint256 indexed id, address indexed issuer, string title, uint256 amount, uint256 deadline);
    event BidPlaced(uint256 indexed tenderId, uint256 indexed bidId, address indexed bidder, uint256 amount);
    event BidWithdrawn(uint256 indexed tenderId, uint256 indexed bidId, address indexed bidder);
    event TenderAwarded(uint256 indexed tenderId, address indexed winner, uint256 amount);
    event TenderCancelled(uint256 indexed tenderId, address indexed issuer);

    function recordSpending(uint256 amount) public {
        require(entities[msg.sender].isActive, "Entity is not active");
        require(amount > 0, "Amount must be greater than 0");

        spendingCount++;
        spendingRecords[spendingCount] = SpendingRecord({
            id: spendingCount,
            entity: msg.sender,
            amount: amount,
            timestamp: block.timestamp
        });

        entities[msg.sender].toBeSpent += amount;
        emit SpendingRecorded(spendingCount, msg.sender, amount);
    }

    function issueTender(
        string memory title,
        string memory description,
        uint256 amount,
        uint256 deadline,
        uint256 minBidAmount,
        uint256 maxBidAmount
    ) public {
        require(entities[msg.sender].isActive, "Entity is not active");
        require(amount > 0, "Amount must be greater than 0");
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(minBidAmount > 0, "Minimum bid amount must be greater than 0");
        require(maxBidAmount > minBidAmount, "Maximum bid amount must be greater than minimum bid amount");

        // Check if entity has sufficient balance
        require(entities[msg.sender].balance >= amount, "Insufficient balance to issue tender");

        tenderCount++;
        tenders[tenderCount] = Tender({
            id: tenderCount,
            title: title,
            description: description,
            amount: amount,
            deadline: deadline,
            issuer: msg.sender,
            isActive: true,
            winner: address(0),
            winningBid: 0,
            minBidAmount: minBidAmount,
            maxBidAmount: maxBidAmount,
            bidCount: 0
        });

        // Deduct the tender amount from entity's balance
        entities[msg.sender].balance -= amount;

        emit TenderIssued(tenderCount, msg.sender, title, amount, deadline);
    }

    function placeBid(uint256 tenderId, uint256 amount) public {
        require(entities[msg.sender].isActive, "Entity is not active");
        require(tenders[tenderId].isActive, "Tender is not active");
        require(block.timestamp < tenders[tenderId].deadline, "Tender deadline has passed");
        require(msg.sender != tenders[tenderId].issuer, "Issuer cannot place bid");
        require(amount >= tenders[tenderId].minBidAmount, "Bid amount below minimum");
        require(amount <= tenders[tenderId].maxBidAmount, "Bid amount above maximum");

        uint256 bidId = tenderBidCount[tenderId]++;
        bids[tenderId][bidId] = Bid({
            id: bidId,
            bidder: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            isWithdrawn: false
        });

        tenders[tenderId].bidCount++;

        emit BidPlaced(tenderId, bidId, msg.sender, amount);

        // Update winning bid if this is the lowest bid
        if (tenders[tenderId].winningBid == 0 || amount < tenders[tenderId].winningBid) {
            tenders[tenderId].winningBid = amount;
            tenders[tenderId].winner = msg.sender;
        }
    }

    function withdrawBid(uint256 tenderId, uint256 bidId) public {
        require(tenders[tenderId].isActive, "Tender is not active");
        require(block.timestamp < tenders[tenderId].deadline, "Tender deadline has passed");
        require(bids[tenderId][bidId].bidder == msg.sender, "Only bidder can withdraw bid");
        require(!bids[tenderId][bidId].isWithdrawn, "Bid already withdrawn");

        bids[tenderId][bidId].isWithdrawn = true;
        tenders[tenderId].bidCount--;

        // Update winning bid if this was the winning bid
        if (msg.sender == tenders[tenderId].winner) {
            // Find the next lowest bid
            uint256 lowestBid = 0;
            address lowestBidder = address(0);
            for (uint256 i = 0; i < tenderBidCount[tenderId]; i++) {
                if (!bids[tenderId][i].isWithdrawn && 
                    (lowestBid == 0 || bids[tenderId][i].amount < lowestBid)) {
                    lowestBid = bids[tenderId][i].amount;
                    lowestBidder = bids[tenderId][i].bidder;
                }
            }
            tenders[tenderId].winningBid = lowestBid;
            tenders[tenderId].winner = lowestBidder;
        }

        emit BidWithdrawn(tenderId, bidId, msg.sender);
    }

    function awardTender(uint256 tenderId) public {
        require(tenders[tenderId].isActive, "Tender is not active");
        require(block.timestamp >= tenders[tenderId].deadline, "Tender deadline has not passed");
        require(tenders[tenderId].winner != address(0), "No valid bids found");
        require(msg.sender == tenders[tenderId].issuer, "Only issuer can award tender");

        Tender storage tender = tenders[tenderId];
        tender.isActive = false;

        // Transfer the tender amount to the winner
        entities[tender.winner].balance += tender.amount;

        emit TenderAwarded(tenderId, tender.winner, tender.winningBid);
    }

    function cancelTender(uint256 tenderId) public {
        require(tenders[tenderId].isActive, "Tender is not active");
        require(msg.sender == tenders[tenderId].issuer, "Only issuer can cancel tender");
        require(block.timestamp < tenders[tenderId].deadline, "Tender deadline has passed");

        Tender storage tender = tenders[tenderId];
        tender.isActive = false;

        // Refund the tender amount to the issuer
        entities[tender.issuer].balance += tender.amount;

        emit TenderCancelled(tenderId, msg.sender);
    }

    function getSpendingRecords(address entityAddress) public view returns (SpendingRecord[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= spendingCount; i++) {
            if (spendingRecords[i].entity == entityAddress) {
                count++;
            }
        }

        SpendingRecord[] memory records = new SpendingRecord[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= spendingCount; i++) {
            if (spendingRecords[i].entity == entityAddress) {
                records[index] = spendingRecords[i];
                index++;
            }
        }
        return records;
    }

    function getTenders(uint256 offset, uint256 limit) public view returns (Tender[] memory) {
        require(offset < tenderCount, "Offset exceeds tender count");
        require(limit > 0, "Limit must be greater than zero");
        
        uint256 resultCount = limit;
        if (offset + limit > tenderCount) {
            resultCount = tenderCount - offset;
        }
        
        Tender[] memory result = new Tender[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            result[i] = tenders[offset + i + 1];
        }
        
        return result;
    }

    function getBids(uint256 tenderId) public view returns (Bid[] memory) {
        uint256 bidCount = tenderBidCount[tenderId];
        Bid[] memory result = new Bid[](bidCount);
        
        for (uint256 i = 0; i < bidCount; i++) {
            result[i] = bids[tenderId][i];
        }
        
        return result;
    }

    function getTenderDetails(uint256 tenderId) public view returns (Tender memory) {
        require(tenderId > 0 && tenderId <= tenderCount, "Invalid tender ID");
        return tenders[tenderId];
    }

    function vote(address entityAddress) public {
        require(hasVoted[msg.sender][entityAddress] == false, "You have already voted for this entity");
        require(entities[entityAddress].isActive, "Entity is not active");
        require(entities[entityAddress].votes[msg.sender] == 0, "Already voted for this entity");

        entities[entityAddress].votes[msg.sender] = 1;
        entities[entityAddress].totalVotes++;
        hasVoted[msg.sender][entityAddress] = true;

        emit Voted(msg.sender, entityAddress);
    }
} 