const { connect, keyStores, utils } = require('near-api-js');

async function checkHuman(accountId) {
    // Configure the connection to the NEAR blockchain
    const near = await connect({
        networkId: "mainnet",
        keyStore: new keyStores.InMemoryKeyStore(),
        nodeUrl: "https://rpc.mainnet.near.org",
        walletUrl: "https://app.mynearwallet.com/"
    });

    // Use a generic account for contract calls
    const staging =  false;
    const contract = staging ? "v1.staging.nada.bot" : "v1.nadabot.near";
    const account = await near.account(accountId);

    // Fetch all donations
    const isHuman = await account.viewFunction({
        contractId: contract,
        methodName: "is_human",
        args: {account_id: accountId}
    });

    console.log(isHuman);

    // Return the top donors and their streaks
    return isHuman;
}

async function humanScore(accountId) {
    // Configure the connection to the NEAR blockchain
    const near = await connect({
        networkId: "mainnet",
        keyStore: new keyStores.InMemoryKeyStore(),
        nodeUrl: "https://rpc.mainnet.near.org",
        walletUrl: "https://app.mynearwallet.com/"
    });

    // Use a generic account for contract calls
    const staging =  false;
    const contract = staging ? "v1.staging.nada.bot" : "v1.nadabot.near";
    const account = await near.account(accountId);

    // Fetch all donations
    const score = await account.viewFunction({
        contractId: contract,
        methodName: "get_human_score",
        args: {account_id: accountId}
    });

    // returns score
    return score.score;
}

// change with the account you wan to check
const testAccount = "odins_eyehole.near"; 
// call just human
checkHuman(testAccount).then(isHuman => {
    // Additional handling if needed
}).catch(error => {
    console.error("Error checking for human:", error);
});
// to get score, also returns is human but just pull score
humanScore(testAccount).then(score => {
    // Additional handling if needed
}).catch(error => {
    console.error("Error checking for human score:", error);
});
