const { connect, keyStores, utils, Contract } = require("near-api-js");

const formatAmount = {
  near: (amount) => utils.format.formatNearAmount(amount),
};

async function checkDonations(
  accountId = "minorityprogrammers.near",
  currency = "near",
  amountToCheck = 1
) {
  // Configure the connection to the NEAR blockchain
  const near = await connect({
    networkId: "mainnet",
    keyStore: new keyStores.InMemoryKeyStore(),
    nodeUrl: "https://rpc.mainnet.near.org",
    walletUrl: "https://app.mynearwallet.com/",
  });

  // Use the specified account for contract calls
  const account = await near.account(accountId);

  // Fetch the list of projects from registry.potlock.near
  const projects = await account.viewFunction({
    contractId: "registry.potlock.near",
    methodName: "get_projects",
    args: {},
  });
  const approvedProjects = projects
    .filter((project) => project.status === "Approved")
    .map((project) => project.id);

  // Fetch All the avaliable pots
  const pots = await account.viewFunction({
    contractId: "v1.potfactory.potlock.near",
    methodName: "get_pots",
    args: {},
  });
  //   Fetch each pot config
  const potsConfig = pots.map((pot) =>
    account.viewFunction({
      contractId: pot.id,
      methodName: "get_config",
      args: {},
    })
  );
  const potsConfigResult = await Promise.all(potsConfig);

  // Fetch All pot donations
  const potsDonations = pots.map((pot) =>
    account.viewFunction({
      contractId: pot.id,
      methodName: "get_donations_for_donor",
      args: {
        donor_id: accountId,
      },
    })
  );

  // mapping pot donations to pot base currency
  const potDonationsBycurrency = {};

  const potsDonationsResults = await Promise.allSettled(potsDonations);

  potsDonationsResults.forEach((potDonation, idx) => {
    if (potDonation.status === "fulfilled") {
      const baseCurrency = potsConfigResult[idx].base_currency;
      if (potDonationsBycurrency[baseCurrency])
        potDonationsBycurrency[baseCurrency].push(...potDonation.value);
      else {
        potDonationsBycurrency[baseCurrency] = [];
        potDonationsBycurrency[baseCurrency].push(...potDonation.value);
      }
    }
  });

  // Fetch the donation history for the specified account from donate.potlock.near
  const donations = await account.viewFunction({
    contractId: "donate.potlock.near",
    methodName: "get_donations_for_donor",
    args: { donor_id: accountId },
  });

  // Filter donations to approved projects and calculate total
  let totalDonations = 0;
  donations.forEach((donation) => {
    if (
      donation.ft_id === currency &&
      approvedProjects.includes(donation.recipient_id)
    ) {
      const donationAmount = parseFloat(
        formatAmount[currency](donation.total_amount)
      );
      totalDonations += donationAmount;
    }
  });

  potDonationsBycurrency[currency]?.forEach((donation) => {
    const donationAmount = parseFloat(
      formatAmount[currency](donation.net_amount)
    );
    totalDonations += donationAmount;
  });

  // Final console log with account name and total donations
  console.log(
    `Account ${accountId} has donated a total of ${totalDonations} ${currency.toUpperCase()} to approved projects`
  );

  // Check if total donations exceed the selected amount
  return totalDonations > amountToCheck;
}

// Example usage with "root.near" as the account ID
const accountId = "minorityprogrammers.near"; // Use root.near as the account ID
const currency = "near";
const amountToCheck = 1; // min amount of donations Allowed
checkDonations(accountId, currency, amountToCheck)
  .then((hasDonatedOverOneNear) => {
    console.log(
      `User account '${accountId}' donated over ${amountToCheck} ${currency} to approved projects: ${hasDonatedOverOneNear}`
    );
  })
  .catch((error) => {
    console.error("Error checking donations:", error);
  });
