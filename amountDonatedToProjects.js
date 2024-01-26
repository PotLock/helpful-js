const { connect, keyStores, utils, Contract } = require('near-api-js');

async function checkDonations(accountId) {
    // Configure the connection to the NEAR blockchain
    const near = await connect({
        networkId: "mainnet",
        keyStore: new keyStores.InMemoryKeyStore(),
        nodeUrl: "https://rpc.mainnet.near.org",
        walletUrl: "https://app.mynearwallet.com/"
    });

    // Use the specified account for contract calls
    const account = await near.account(accountId);

    // Fetch the list of projects from registry.potlock.near
    const projects = await account.viewFunction({
        contractId: "registry.potlock.near",
        methodName: "get_projects",
        args: {}
    });
    const approvedProjects = projects.filter(project => project.status === "Approved").map(project => project.id);

    // Print out each approved project
    console.log("Approved Projects:");
    approvedProjects.forEach((project, index) => {
        console.log(`${index + 1}. Project ID: ${project}`);
    });

    // Fetch the donation history for the specified account from donate.potlock.near
    const donations = await account.viewFunction({
        contractId: "donate.potlock.near",
        methodName: "get_donations_for_donor",
        args: { donor_id: accountId }
    });

    // Print out each donation
    console.log("Donations:");
    donations.forEach((donation, index) => {
        const donationAmount = parseFloat(utils.format.formatNearAmount(donation.total_amount));
        console.log(`${index + 1}. Donation Amount: ${donationAmount} NEAR, FT ID: ${donation.ft_id} Recipient ID: ${donation.recipient_id}`);
    });

    // Filter donations to approved projects and calculate total
    let totalDonations = 0;
    donations.forEach(donation => {
        if (donation.ft_id === "near" && approvedProjects.includes(donation.recipient_id)) {
            // const donationAmount = parseFloat(utils.format.formatNearAmount(donation.total_amount));
                        const donationAmount =donation.total_amount;
            // totalDonations += donationAmount;
            totalDonations += donationAmount;
            // Log the donation amount and recipient ID
            console.log(`Filtered Donation Amount: ${donationAmount} NEAR, Recipient ID: ${donation.recipient_id}`);
        }
    });

    // Final console log with account name and total donations
    console.log(`Account ${accountId} has donated a total of ${totalDonations} NEAR to approved projects`);

    // Check if total donations exceed 1 NEAR
    return totalDonations > 1;
}

// Example usage with "root.near" as the account ID
const accountId = "root.near"; // Use root.near as the account ID
checkDonations(accountId).then(hasDonatedOverOneNear => {
    console.log(`User account '${accountId}' donated over 1 NEAR to approved projects: ${hasDonatedOverOneNear}`);
}).catch(error => {
    console.error("Error checking donations:", error);
});
