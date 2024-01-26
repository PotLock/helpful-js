const { connect, keyStores, utils } = require('near-api-js');

async function checkDonationsStreak(accountId) {
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

    // Fetch the donation history for the specified account
    const donations = await account.viewFunction({
        contractId: "donate.potlock.near",
        methodName: "get_donations_for_donor",
        args: { donor_id: accountId }
    });

    // Filter donations for approved projects
    const filteredDonations = donations.filter(donation => approvedProjects.includes(donation.recipient_id));

    // Sort filtered donations by date
    filteredDonations.sort((a, b) => a.donated_at_ms - b.donated_at_ms);

    // Calculate consecutive donation days
    let maxStreak = 0;
    let currentStreak = 0;
    let lastDonationDate = null;

    filteredDonations.forEach(donation => {
        const donationDate = new Date(donation.donated_at_ms);
        donationDate.setHours(0, 0, 0, 0); // Reset time to start of the day

        if (lastDonationDate) {
            const nextDay = new Date(lastDonationDate);
            nextDay.setDate(nextDay.getDate() + 1);

            if (donationDate.getTime() === nextDay.getTime()) {
                currentStreak++;
            } else if (donationDate.getTime() !== lastDonationDate.getTime()) {
                currentStreak = 1;
            }
        } else {
            currentStreak = 1;
        }

        if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
        }

        lastDonationDate = donationDate;
    });

    // Final console log with account name and maximum streak
    console.log(`Account ${accountId} has a maximum donation streak of ${maxStreak} days`);
}

// Example usage with "minorityprogrammers.near" as the account ID
const accountId = "minorityprogrammers.near"; // Use minorityprogrammers.near as the account ID
checkDonationsStreak(accountId).then(() => {
    // Additional handling if needed
}).catch(error => {
    console.error("Error checking donations streak:", error);
});
