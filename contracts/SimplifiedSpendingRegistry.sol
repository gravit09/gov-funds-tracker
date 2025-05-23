// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract SimplifiedSpendingRegistry {
    struct GovernmentEntity {
        string name;
        bool isActive;
        uint256 balance;
        uint256 needToSpend;  
        uint256 happinessRating;
        uint256 totalVotes;
        uint256 lastVoteTimestamp;
    }

    struct SpendingRecord {
        uint256 id;
        address entity;
        string purpose;
        uint256 amount;
        string documentHash;
        uint256 timestamp;
    }

    struct MicroTransaction {
        uint256 id;
        uint256 spendingRecordId;
        address entity;
        string description;
        uint256 amount;
        uint256 timestamp;
    }

    struct FundRequest {
        uint256 id;
        address entity;
        uint256 amount;
        string reason;
        string documentHash;
        uint256 timestamp;
        bool isApproved;
        bool isRejected;
    }

    struct IssuedFund {
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

    mapping(address => GovernmentEntity) public governmentEntities;
    mapping(uint256 => SpendingRecord) public spendingRecords;
    mapping(uint256 => MicroTransaction) public microTransactions;
    mapping(uint256 => IssuedFund) public issuedFunds;
    mapping(address => mapping(address => bool)) public hasVoted;
    address[] public entityAddresses;
    uint256 public recordCount;
    uint256 public requestCount;
    uint256 public issuedFundCount;
    uint256 private spendingRecordCount;
    uint256 private microTransactionCount;
    mapping(uint256 => uint256[]) public spendingRecordMicroTransactions;
    FundRequest[] public fundRequests;
    mapping(uint256 => Tender) public tenders;
    mapping(uint256 => mapping(uint256 => Bid)) public bids; // tenderId => bidId => Bid
    mapping(uint256 => uint256) public tenderBidCount; // tenderId => number of bids
    uint256 public tenderCount;

    address public centralGovernment;
    uint256 public constant VOTING_COOLDOWN = 1 days;
    uint256 public constant BONUS_AMOUNT = 1 ether; // 1 ETH bonus for top performer
    uint256 public lastBonusDistribution;

    // Events
    event EntityRegistered(address indexed entityAddress, string name);
    event EntityDeactivated(address indexed entityAddress);
    event FundsIssued(uint256 indexed id, address indexed to, uint256 amount);
    event SpendingRecorded(uint256 indexed id, address indexed entity, uint256 amount, string documentHash);
    event FundRequested(
        uint256 indexed id,
        address indexed entity,
        uint256 amount,
        string reason,
        string documentHash
    );
    event FundRequestApproved(uint256 indexed id, address indexed entity);
    event FundRequestRejected(uint256 indexed id, address indexed entity);
    event Voted(address indexed voter, address indexed entity, uint256 rating);
    event BonusDistributed(address indexed entity, uint256 amount);
    event MicroTransactionRecorded(
        uint256 indexed id,
        uint256 indexed spendingRecordId,
        address indexed entity,
        string description,
        uint256 amount
    );
    event TenderIssued(uint256 indexed id, address indexed issuer, string title, uint256 amount, uint256 deadline);
    event BidPlaced(uint256 indexed tenderId, uint256 indexed bidId, address indexed bidder, uint256 amount);
    event BidWithdrawn(uint256 indexed tenderId, uint256 indexed bidId, address indexed bidder);
    event TenderAwarded(uint256 indexed tenderId, address indexed winner, uint256 amount);
    event TenderCancelled(uint256 indexed tenderId, address indexed issuer);

    constructor() {
        centralGovernment = msg.sender;
        lastBonusDistribution = block.timestamp;
    }

    modifier onlyCentralGovernment() {
        require(msg.sender == centralGovernment, "Only central government can perform this action");
        _;
    }

    modifier onlyRegisteredEntity() {
        require(governmentEntities[msg.sender].isActive, "Only active registered entities can perform this action");
        _;
    }

    // Register a new government entity
    function registerEntity(address entityAddress, string memory name) public onlyCentralGovernment {
        require(entityAddress != address(0), "Entity address cannot be zero");
        require(bytes(name).length > 0, "Entity name cannot be empty");
        require(!governmentEntities[entityAddress].isActive, "Entity already registered and active");
        
        governmentEntities[entityAddress] = GovernmentEntity({
            name: name,
            isActive: true,
            balance: 0,
            needToSpend: 0,
            happinessRating: 0,
            totalVotes: 0,
            lastVoteTimestamp: 0
        });
        
        entityAddresses.push(entityAddress);
        emit EntityRegistered(entityAddress, name);
    }

    // Deactivate a government entity
    function deactivateEntity(address entityAddress) public onlyCentralGovernment {
        require(governmentEntities[entityAddress].isActive, "Entity not active");
        governmentEntities[entityAddress].isActive = false;
        emit EntityDeactivated(entityAddress);
    }

    // Issue funds to a registered entity
    function issueFunds(address entityAddress, uint256 amount) public payable onlyCentralGovernment {
        require(governmentEntities[entityAddress].isActive, "Entity not active");
        require(msg.value == amount, "Sent value must match the amount");
        
        governmentEntities[entityAddress].balance += amount;
        
        // Record the issued fund
        issuedFundCount++;
        issuedFunds[issuedFundCount] = IssuedFund({
            id: issuedFundCount,
            entity: entityAddress,
            amount: amount,
            timestamp: block.timestamp
        });
        
        emit FundsIssued(issuedFundCount, entityAddress, amount);
    }

    // Record spending with documentation
    function recordSpending(
        string memory purpose,
        uint256 amount,
        string memory documentHash
    ) public onlyRegisteredEntity {
        require(bytes(purpose).length > 0, "Purpose cannot be empty");
        require(amount > 0, "Amount must be greater than zero");
        require(bytes(documentHash).length > 0, "Document hash cannot be empty");
        require(governmentEntities[msg.sender].balance >= amount, "Insufficient balance");
        
        // Reduce the entity's balance and add to needToSpend
        governmentEntities[msg.sender].balance -= amount;
        governmentEntities[msg.sender].needToSpend += amount;
        
        // Record the spending
        spendingRecordCount++;
        spendingRecords[spendingRecordCount] = SpendingRecord({
            id: spendingRecordCount,
            entity: msg.sender,
            purpose: purpose,
            amount: amount,
            documentHash: documentHash,
            timestamp: block.timestamp
        });
        
        emit SpendingRecorded(spendingRecordCount, msg.sender, amount, documentHash);
    }

    // Get spending record by ID
    function getSpendingRecord(uint256 recordId) public view returns (SpendingRecord memory) {
        require(recordId > 0 && recordId <= spendingRecordCount, "Invalid record ID");
        return spendingRecords[recordId];
    }

    // Get all spending records (paginated)
    function getSpendingRecords(uint256 offset, uint256 limit) public view returns (SpendingRecord[] memory) {
        require(offset < spendingRecordCount, "Offset exceeds record count");
        require(limit > 0, "Limit must be greater than zero");
        
        uint256 resultCount = limit;
        if (offset + limit > spendingRecordCount) {
            resultCount = spendingRecordCount - offset;
        }
        
        SpendingRecord[] memory result = new SpendingRecord[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            result[i] = spendingRecords[offset + i + 1];
        }
        
        return result;
    }

    // Get spending records for a specific entity (paginated)
    function getEntitySpendingRecords(address entityAddress, uint256 offset, uint256 limit) public view returns (SpendingRecord[] memory) {
        require(governmentEntities[entityAddress].isActive || !governmentEntities[entityAddress].isActive, "Not a registered entity");
        
        // First, count how many records belong to this entity
        uint256 entityRecordCount = 0;
        for (uint256 i = 1; i <= spendingRecordCount; i++) {
            if (spendingRecords[i].entity == entityAddress) {
                entityRecordCount++;
            }
        }
        
        require(offset < entityRecordCount, "Offset exceeds entity record count");
        require(limit > 0, "Limit must be greater than zero");
        
        uint256 resultCount = limit;
        if (offset + limit > entityRecordCount) {
            resultCount = entityRecordCount - offset;
        }
        
        SpendingRecord[] memory result = new SpendingRecord[](resultCount);
        uint256 currentOffset = 0;
        uint256 resultIndex = 0;
        
        for (uint256 i = 1; i <= spendingRecordCount && resultIndex < resultCount; i++) {
            if (spendingRecords[i].entity == entityAddress) {
                if (currentOffset >= offset) {
                    result[resultIndex] = spendingRecords[i];
                    resultIndex++;
                }
                currentOffset++;
            }
        }
        
        return result;
    }

    // Get entity details
    function getEntityDetails(address entityAddress) public view returns (
        string memory name,
        bool isActive,
        uint256 balance,
        uint256 needToSpend
    ) {
        require(governmentEntities[entityAddress].isActive || !governmentEntities[entityAddress].isActive, "Not a registered entity");
        
        GovernmentEntity memory entity = governmentEntities[entityAddress];
        return (entity.name, entity.isActive, entity.balance, entity.needToSpend);
    }

    // Get all entity addresses
    function getAllEntityAddresses() public view returns (address[] memory) {
        return entityAddresses;
    }

    // Get entity count
    function getEntityCount() public view returns (uint256) {
        return entityAddresses.length;
    }

    // Get balance of contract
    function getContractBalance() public view onlyCentralGovernment returns (uint256) {
        return address(this).balance;
    }

    function requestFunds(uint256 amount, string memory reason, string memory documentHash)
        public
        onlyRegisteredEntity
    {
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(reason).length > 0, "Reason cannot be empty");
        require(bytes(documentHash).length > 0, "Document hash cannot be empty");

        uint256 requestId = requestCount++;
        fundRequests.push(
            FundRequest({
                id: requestId,
                entity: msg.sender,
                amount: amount,
                reason: reason,
                documentHash: documentHash,
                timestamp: block.timestamp,
                isApproved: false,
                isRejected: false
            })
        );
        emit FundRequested(requestId, msg.sender, amount, reason, documentHash);
    }

    function approveFundRequest(uint256 requestId) public onlyCentralGovernment {
        require(requestId < requestCount, "Invalid request ID");
        FundRequest storage request = fundRequests[requestId];
        require(!request.isApproved && !request.isRejected, "Request already processed");
        
        request.isApproved = true;
        governmentEntities[request.entity].balance += request.amount;
        emit FundRequestApproved(requestId, request.entity);
    }

    function rejectFundRequest(uint256 requestId) public onlyCentralGovernment {
        require(requestId < requestCount, "Invalid request ID");
        FundRequest storage request = fundRequests[requestId];
        require(!request.isApproved && !request.isRejected, "Request already processed");
        
        request.isRejected = true;
        emit FundRequestRejected(requestId, request.entity);
    }

    function getFundRequest(uint256 requestId) public view returns (FundRequest memory) {
        require(requestId < requestCount, "Invalid request ID");
        return fundRequests[requestId];
    }

    function getFundRequests(uint256 offset, uint256 limit) public view returns (FundRequest[] memory) {
        uint256 end = offset + limit;
        if (end > requestCount) {
            end = requestCount;
        }
        uint256 resultLength = end - offset;
        FundRequest[] memory result = new FundRequest[](resultLength);
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = fundRequests[offset + i];
        }
        return result;
    }

    function getEntityFundRequests(address entityAddress, uint256 offset, uint256 limit) 
        public 
        view 
        returns (FundRequest[] memory) 
    {
        uint256 count = 0;
        for (uint256 i = 0; i < requestCount; i++) {
            if (fundRequests[i].entity == entityAddress) {
                count++;
            }
        }
        uint256 end = offset + limit;
        if (end > count) {
            end = count;
        }
        uint256 resultLength = end - offset;
        FundRequest[] memory result = new FundRequest[](resultLength);
        uint256 resultIndex = 0;
        for (uint256 i = 0; i < requestCount && resultIndex < resultLength; i++) {
            if (fundRequests[i].entity == entityAddress) {
                if (resultIndex >= offset) {
                    result[resultIndex - offset] = fundRequests[i];
                }
                resultIndex++;
            }
        }
        return result;
    }

    // Get issued fund by ID
    function getIssuedFund(uint256 fundId) public view returns (IssuedFund memory) {
        require(fundId > 0 && fundId <= issuedFundCount, "Invalid fund ID");
        return issuedFunds[fundId];
    }

    // Get all issued funds (paginated)
    function getIssuedFunds(uint256 offset, uint256 limit) public view returns (IssuedFund[] memory) {
        require(offset < issuedFundCount, "Offset exceeds issued fund count");
        require(limit > 0, "Limit must be greater than zero");
        
        uint256 resultCount = limit;
        if (offset + limit > issuedFundCount) {
            resultCount = issuedFundCount - offset;
        }
        
        IssuedFund[] memory result = new IssuedFund[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            result[i] = issuedFunds[offset + i + 1];
        }
        
        return result;
    }

    // Get issued funds for a specific entity (paginated)
    function getEntityIssuedFunds(address entityAddress, uint256 offset, uint256 limit) public view returns (IssuedFund[] memory) {
        require(governmentEntities[entityAddress].isActive || !governmentEntities[entityAddress].isActive, "Not a registered entity");
        
        // First, count how many funds were issued to this entity
        uint256 entityFundCount = 0;
        for (uint256 i = 1; i <= issuedFundCount; i++) {
            if (issuedFunds[i].entity == entityAddress) {
                entityFundCount++;
            }
        }
        
        require(offset < entityFundCount, "Offset exceeds entity fund count");
        require(limit > 0, "Limit must be greater than zero");
        
        uint256 resultCount = limit;
        if (offset + limit > entityFundCount) {
            resultCount = entityFundCount - offset;
        }
        
        IssuedFund[] memory result = new IssuedFund[](resultCount);
        uint256 currentOffset = 0;
        uint256 resultIndex = 0;
        
        for (uint256 i = 1; i <= issuedFundCount && resultIndex < resultCount; i++) {
            if (issuedFunds[i].entity == entityAddress) {
                if (currentOffset >= offset) {
                    result[resultIndex] = issuedFunds[i];
                    resultIndex++;
                }
                currentOffset++;
            }
        }
        
        return result;
    }

    // Vote for an entity's performance
    function voteForEntity(address entityAddress, uint256 rating) public {
        require(governmentEntities[entityAddress].isActive, "Entity is not active");
        require(rating >= 1 && rating <= 5, "Rating must be between 1 and 5");
        require(!hasVoted[msg.sender][entityAddress], "You have already voted for this entity");
        
        // Update entity's happiness rating
        uint256 currentRating = governmentEntities[entityAddress].happinessRating;
        uint256 totalVotes = governmentEntities[entityAddress].totalVotes;
        uint256 newRating = ((currentRating * totalVotes) + rating) / (totalVotes + 1);
        
        governmentEntities[entityAddress].happinessRating = newRating;
        governmentEntities[entityAddress].totalVotes += 1;
        governmentEntities[entityAddress].lastVoteTimestamp = block.timestamp;
        
        // Mark this voter as having voted for this entity
        hasVoted[msg.sender][entityAddress] = true;
        
        emit Voted(msg.sender, entityAddress, rating);
    }

    // Distribute bonus to top performing entity
    function distributeBonus() public onlyCentralGovernment {
        require(block.timestamp >= lastBonusDistribution + VOTING_COOLDOWN, "Too soon to distribute bonus");
        require(address(this).balance >= BONUS_AMOUNT, "Insufficient contract balance");

        address topEntity = address(0);
        uint256 highestRating = 0;

        for (uint256 i = 0; i < entityAddresses.length; i++) {
            address entityAddress = entityAddresses[i];
            if (governmentEntities[entityAddress].isActive && 
                governmentEntities[entityAddress].happinessRating > highestRating) {
                highestRating = governmentEntities[entityAddress].happinessRating;
                topEntity = entityAddress;
            }
        }

        require(topEntity != address(0), "No eligible entities found");

        governmentEntities[topEntity].balance += BONUS_AMOUNT;
        lastBonusDistribution = block.timestamp;

        emit BonusDistributed(topEntity, BONUS_AMOUNT);
    }

    // Get entity's happiness rating
    function getEntityHappinessRating(address entityAddress) public view returns (
        uint256 rating,
        uint256 totalVotes,
        uint256 lastVoteTime
    ) {
        require(governmentEntities[entityAddress].isActive || !governmentEntities[entityAddress].isActive, "Not a registered entity");
        GovernmentEntity memory entity = governmentEntities[entityAddress];
        return (entity.happinessRating, entity.totalVotes, entity.lastVoteTimestamp);
    }

    // Get all entities with their happiness ratings
    function getAllEntityRatings() public view returns (
        address[] memory addresses,
        uint256[] memory ratings,
        uint256[] memory votes
    ) {
        uint256 count = entityAddresses.length;
        addresses = new address[](count);
        ratings = new uint256[](count);
        votes = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            addresses[i] = entityAddresses[i];
            ratings[i] = governmentEntities[entityAddresses[i]].happinessRating;
            votes[i] = governmentEntities[entityAddresses[i]].totalVotes;
        }

        return (addresses, ratings, votes);
    }

    // Check if an address has already voted
    function checkVotingStatus(address voter) public view returns (bool) {
        return hasVoted[voter][msg.sender];
    }

    // Get time until next bonus distribution
    function getTimeUntilNextBonus() public view returns (uint256) {
        if (block.timestamp >= lastBonusDistribution + VOTING_COOLDOWN) {
            return 0;
        }
        return (lastBonusDistribution + VOTING_COOLDOWN) - block.timestamp;
    }

    // Record micro-transaction for a spending record
    function recordMicroTransaction(
        uint256 spendingRecordId,
        string memory description,
        uint256 amount
    ) public onlyRegisteredEntity {
        require(spendingRecords[spendingRecordId].entity == msg.sender, "Not authorized to add micro-transactions to this spending record");
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(governmentEntities[msg.sender].needToSpend >= amount, "Insufficient needToSpend balance");

        // Deduct from needToSpend
        governmentEntities[msg.sender].needToSpend -= amount;

        microTransactionCount++;
        microTransactions[microTransactionCount] = MicroTransaction(
            microTransactionCount,
            spendingRecordId,
            msg.sender,
            description,
            amount,
            block.timestamp
        );

        spendingRecordMicroTransactions[spendingRecordId].push(microTransactionCount);

        emit MicroTransactionRecorded(
            microTransactionCount,
            spendingRecordId,
            msg.sender,
            description,
            amount
        );
    }

    // Get micro-transactions for a spending record
    function getSpendingRecordMicroTransactions(uint256 spendingRecordId) public view returns (MicroTransaction[] memory) {
        uint256[] memory microTransactionIds = spendingRecordMicroTransactions[spendingRecordId];
        MicroTransaction[] memory result = new MicroTransaction[](microTransactionIds.length);
        
        for (uint256 i = 0; i < microTransactionIds.length; i++) {
            result[i] = microTransactions[microTransactionIds[i]];
        }
        
        return result;
    }

    // Get all micro-transactions with pagination
    function getMicroTransactions(uint256 offset, uint256 limit) public view returns (MicroTransaction[] memory) {
        uint256 end = offset + limit;
        if (end > microTransactionCount) {
            end = microTransactionCount;
        }
        uint256 resultLength = end - offset;
        
        MicroTransaction[] memory result = new MicroTransaction[](resultLength);
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = microTransactions[offset + i + 1];
        }
        
        return result;
    }

    function issueTender(
        string memory title,
        string memory description,
        uint256 amount,
        uint256 deadline,
        uint256 minBidAmount,
        uint256 maxBidAmount
    ) public onlyRegisteredEntity {
        require(amount > 0, "Amount must be greater than 0");
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(minBidAmount > 0, "Minimum bid amount must be greater than 0");
        require(maxBidAmount > minBidAmount, "Maximum bid amount must be greater than minimum bid amount");

        // Check if entity has sufficient balance
        require(governmentEntities[msg.sender].balance >= amount, "Insufficient balance to issue tender");

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
        governmentEntities[msg.sender].balance -= amount;

        emit TenderIssued(tenderCount, msg.sender, title, amount, deadline);
    }

    function placeBid(uint256 tenderId, uint256 amount) public payable {
        require(tenders[tenderId].isActive, "Tender is not active");
        require(block.timestamp < tenders[tenderId].deadline, "Tender deadline has passed");
        require(msg.sender != tenders[tenderId].issuer, "Issuer cannot place bid");
        require(amount >= tenders[tenderId].minBidAmount, "Bid amount below minimum");
        require(amount <= tenders[tenderId].maxBidAmount, "Bid amount above maximum");
        require(msg.value == amount, "Incorrect ETH amount sent");

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

    function withdrawBid(uint256 tenderId, uint256 bidId) public onlyRegisteredEntity {
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

    function awardTender(uint256 tenderId) public onlyRegisteredEntity {
        require(tenders[tenderId].isActive, "Tender is not active");
        require(block.timestamp >= tenders[tenderId].deadline, "Tender deadline has not passed");
        require(tenders[tenderId].winner != address(0), "No valid bids found");
        require(msg.sender == tenders[tenderId].issuer, "Only issuer can award tender");

        Tender storage tender = tenders[tenderId];
        tender.isActive = false;

        // Transfer the tender amount to the winner
        governmentEntities[tender.winner].balance += tender.amount;

        emit TenderAwarded(tenderId, tender.winner, tender.winningBid);
    }

    function cancelTender(uint256 tenderId) public onlyRegisteredEntity {
        require(tenders[tenderId].isActive, "Tender is not active");
        require(msg.sender == tenders[tenderId].issuer, "Only issuer can cancel tender");
        require(block.timestamp < tenders[tenderId].deadline, "Tender deadline has passed");

        Tender storage tender = tenders[tenderId];
        tender.isActive = false;

        // Refund the tender amount to the issuer
        governmentEntities[tender.issuer].balance += tender.amount;

        emit TenderCancelled(tenderId, msg.sender);
    }

    function getTenders(uint256 offset, uint256 limit) public view returns (Tender[] memory) {
        // If offset is greater than or equal to tender count, return empty array
        if (offset >= tenderCount) {
            return new Tender[](0);
        }
        
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
}