const { connect, keyStores, utils } = require('near-api-js');

async function getTopDonorsStreak(numberToDisplay) {
    // Configure the connection to the NEAR blockchain
    const near = await connect({
        networkId: "mainnet",
        keyStore: new keyStores.InMemoryKeyStore(),
        nodeUrl: "https://rpc.mainnet.near.org",
        walletUrl: "https://app.mynearwallet.com/"
    });

    // Use a generic account for contract calls
    const account = await near.account("example-account.near");

    // Fetch the list of projects from registry.potlock.near
    const projects = await account.viewFunction({
        contractId: "registry.potlock.near",
        methodName: "get_projects",
        args: {}
    });
    const approvedProjects = projects.filter(project => project.status === "Approved").map(project => project.id);

    // Fetch all donations
    const donations = await account.viewFunction({
        contractId: "donate.potlock.near",
        methodName: "get_donations",
        args: {}
    });

    // Filter donations for approved projects
    const filteredDonations = donations.filter(donation => approvedProjects.includes(donation.recipient_id));

    // Calculate daily streaks for each donor
    let donorStreaks = {};
    filteredDonations.forEach(donation => {
        const donorId = donation.donor_id;
        const donationDate = new Date(donation.donated_at_ms);
        donationDate.setHours(0, 0, 0, 0); // Reset time to start of the day

        if (!donorStreaks[donorId]) {
            donorStreaks[donorId] = { lastDonationDate: null, currentStreak: 0, maxStreak: 0, isActive: false, streakEnded: null };
        }

        const nextDay = donorStreaks[donorId].lastDonationDate ?
            new Date(donorStreaks[donorId].lastDonationDate.getTime() + (24 * 60 * 60 * 1000)) : null;

        if (donorStreaks[donorId].lastDonationDate && donationDate.getTime() === nextDay.getTime()) {
            // Continuing the streak
            donorStreaks[donorId].currentStreak++;
        } else {
            // Streak broken or first donation
            if (donorStreaks[donorId].currentStreak > 0 && donorStreaks[donorId].lastDonationDate) {
                donorStreaks[donorId].streakEnded = new Date(donorStreaks[donorId].lastDonationDate);
            }
            donorStreaks[donorId].currentStreak = 1;
        }

        if (donorStreaks[donorId].currentStreak > donorStreaks[donorId].maxStreak) {
            donorStreaks[donorId].maxStreak = donorStreaks[donorId].currentStreak;
            donorStreaks[donorId].isActive = true;
        }

        donorStreaks[donorId].lastDonationDate = donationDate;
    });

    // Determine active status of streaks
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of the day
    Object.values(donorStreaks).forEach(streak => {
        if (streak.lastDonationDate.getTime() !== today.getTime()) {
            streak.isActive = false;
        }
    });

    // Sort donors by their highest streaks and get the top donors based on numberToDisplay
    const topDonors = Object.entries(donorStreaks)
        .sort((a, b) => b[1].maxStreak - a[1].maxStreak)
        .slice(0, numberToDisplay);

    // Print the top donors and their streaks
    console.log(`Top ${numberToDisplay} Donors with Highest Daily Donation Streaks:`);
    topDonors.forEach(([donorId, streakInfo], index) => {
        const activeStatus = streakInfo.isActive 
            ? "Active" 
            : `Ended on ${streakInfo.streakEnded ? streakInfo.streakEnded.toDateString() : "N/A"}`;
        console.log(`${index + 1}. Donor ID: ${donorId}, Streak: ${streakInfo.maxStreak} days (${activeStatus})`);
    });

    // Return the top donors and their streaks
    return topDonors;
}

// Example usage
const numberToDisplay = 10; // Set the number of top donors to display
getTopDonorsStreak(numberToDisplay).then(topDonors => {
    // Additional handling if needed
}).catch(error => {
    console.error("Error getting top donors streak:", error);
});
