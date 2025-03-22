// Contract configuration
const contractAddress = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
const contractABI = [
  "function getEntityDetails(address entityAddress) public view returns (string memory name, bool isActive, uint256 balance)",
  "function getAllEntityAddresses() public view returns (address[] memory)",
  "function approveEntity(address entityAddress) public",
  "function rejectEntity(address entityAddress) public",
  "function getEntitySpendingRecords(address entityAddress, uint256 offset, uint256 limit) public view returns (tuple(uint256 id, address entity, string purpose, uint256 amount, string documentHash, uint256 timestamp)[] memory)",
  "function getEntityFundRequests(address entityAddress, uint256 offset, uint256 limit) public view returns (tuple(uint256 id, address entity, uint256 amount, string reason, string documentHash, uint256 timestamp, bool isApproved, bool isRejected)[] memory)",
];

// Get all entities
const getAllEntities = async () => {
  try {
    if (!contract) {
      throw new Error("Please connect your account first");
    }

    setIsLoading(true);
    setError("");

    // Test contract connection
    try {
      await contract.getEntityDetails(contractAddress);
    } catch (error) {
      throw new Error("Failed to connect to the contract. Please check if the contract is deployed.");
    }

    // Get all entity addresses
    const entityAddresses = await contract.getAllEntityAddresses();
    console.log("Retrieved entity addresses:", entityAddresses);

    if (!entityAddresses || entityAddresses.length === 0) {
      setEntityList("<p class='text-gray-300'>No entities found.</p>");
      return;
    }

    // Get details for each entity
    let html = "";
    for (const address of entityAddresses) {
      try {
        const [name, isActive, balance] = await contract.getEntityDetails(address);
        html += `
          <div class="bg-gray-700/30 p-4 rounded-lg mb-4 border border-gray-600/50">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-lg font-medium text-white">${name}</h3>
                <p class="text-sm text-gray-400">${address}</p>
                <p class="text-sm ${isActive ? 'text-green-400' : 'text-red-400'}">
                  Status: ${isActive ? 'Active' : 'Not Active'}
                </p>
                <p class="text-sm text-gray-300">
                  Balance: ${ethers.formatEther(balance)} ETH
                </p>
              </div>
              <div class="flex space-x-2">
                <button
                  onClick={() => approveEntity(address)}
                  disabled={!isActive}
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Approve
                </button>
                <button
                  onClick={() => rejectEntity(address)}
                  disabled={!isActive}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        `;
      } catch (error) {
        console.error(`Error getting details for entity ${address}:`, error);
        html += `
          <div class="bg-gray-700/30 p-4 rounded-lg mb-4 border border-gray-600/50">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-lg font-medium text-white">Unknown Entity</h3>
                <p class="text-sm text-gray-400">${address}</p>
                <p class="text-sm text-red-400">Error loading details</p>
              </div>
            </div>
          </div>
        `