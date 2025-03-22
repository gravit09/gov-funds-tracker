// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GovernmentFunds {
    struct Entity {
        bool isActive;
        mapping(address => uint256) votes;
        uint256 totalVotes;
        uint256 toBeSpent;
    }

    struct SpendingRecord {
        uint256 id;
        address entity;
        uint256 amount;
        uint256 timestamp;
    }

    struct MicroTransaction {
        uint256 id;
        uint256 spendingId;
        address entity;
        uint256 amount;
        string description;
        uint256 timestamp;
    }

    mapping(address => Entity) public entities;
    mapping(address => mapping(address => bool)) public hasVoted;
    mapping(uint256 => SpendingRecord) public spendingRecords;
    mapping(uint256 => MicroTransaction) public microTransactions;
    uint256 public spendingCount;
    uint256 public microTransactionCount;

    event Voted(address indexed voter, address indexed entity);
    event SpendingRecorded(uint256 indexed id, address indexed entity, uint256 amount);
    event MicroTransactionRecorded(uint256 indexed id, uint256 indexed spendingId, address indexed entity, uint256 amount);

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

    function recordMicroTransaction(uint256 spendingId, uint256 amount, string memory description) public {
        require(entities[msg.sender].isActive, "Entity is not active");
        require(amount > 0, "Amount must be greater than 0");
        require(spendingRecords[spendingId].entity == msg.sender, "Not authorized to add micro-transactions to this spending");
        require(entities[msg.sender].toBeSpent >= amount, "Insufficient toBeSpent balance");

        microTransactionCount++;
        microTransactions[microTransactionCount] = MicroTransaction({
            id: microTransactionCount,
            spendingId: spendingId,
            entity: msg.sender,
            amount: amount,
            description: description,
            timestamp: block.timestamp
        });

        entities[msg.sender].toBeSpent -= amount;
        emit MicroTransactionRecorded(microTransactionCount, spendingId, msg.sender, amount);
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

    function getMicroTransactions(uint256 spendingId) public view returns (MicroTransaction[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= microTransactionCount; i++) {
            if (microTransactions[i].spendingId == spendingId) {
                count++;
            }
        }

        MicroTransaction[] memory transactions = new MicroTransaction[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= microTransactionCount; i++) {
            if (microTransactions[i].spendingId == spendingId) {
                transactions[index] = microTransactions[i];
                index++;
            }
        }
        return transactions;
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