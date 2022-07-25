
//https://docs.biconomy.io/products/enable-gasless-transactions/choose-an-approach-to-enable-gasless/eip-2771/2.-code-changes/sdk
//const Biconomy = require('@biconomy/mexa');
import { Biconomy } from "@biconomy/mexa";

async function transferUsdc() {
  let provider = new ethers.providers.Web3Provider(window.ethereum, "any");
  let receiver = document.getElementById("receiver").value;
  let amount = document.getElementById("amount").value;
  let response;

  const biconomy = new Biconomy(provider, {
    apiKey: '5oyBzRCJS.cbf1967f-f576-4bb3-ba9a-fa3900f54ea1',
    contractAddresses: ['0x3D249B8E3eA85F1094Be7701d0D703bA10805A7E'],
    });      
  await biconomy.init();

  console.log(`Biconomy initialized`);


  const usdc = {
    address: "0x3D249B8E3eA85F1094Be7701d0D703bA10805A7E",
    abi: [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function gimmeSome() external",
      "function balanceOf(address _owner) public view returns (uint256 balance)",
      "function transfer(address _to, uint256 _value) public returns (bool success)",
    ],
  };

  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  let userAddress = await signer.getAddress();

  const usdcContract = new ethers.Contract(usdc.address, usdc.abi, signer); //might have to change, maybe it doesnt work for the new contract

  try {
    receiver = ethers.utils.getAddress(receiver);
  } catch {
    response = `Invalid address: ${receiver}`;
    document.getElementById("transferResponse").innerText = response;
    document.getElementById("transferResponse").style.display = "block";
  }

  try {
    amount = ethers.utils.parseUnits(amount, 6);
    if (amount.isNegative()) {
      throw new Error();
    }
  } catch {
    console.error(`Invalid amount: ${amount}`);
    response = `Invalid amount: ${amount}`;
    document.getElementById("transferResponse").innerText = response;
    document.getElementById("transferResponse").style.display = "block";
  }

  const balance = await usdcContract.balanceOf(userAddress);

  if (balance.lt(amount)) {
    let amountFormatted = ethers.utils.formatUnits(amount, 6);
    let balanceFormatted = ethers.utils.formatUnits(balance, 6);
    console.error(
      `Insufficient balance receiver send ${amountFormatted} (You have ${balanceFormatted})`
    );

    response = `Insufficient balance receiver send ${amountFormatted} (You have ${balanceFormatted})`;
    document.getElementById("transferResponse").innerText = response;
    document.getElementById("transferResponse").style.display = "block";
  }
  let amountFormatted = ethers.utils.formatUnits(amount, 6);

  console.log(`Transferring ${amountFormatted} USDC receiver ${receiver}...`);

  response = `Transferring ${amountFormatted} USDC receiver ${receiver.slice(
    0,
    6
  )}...`;
  document.getElementById("transferResponse").innerText = response;
  document.getElementById("transferResponse").style.display = "block";


  /*
  const tx = await usdcContract.transfer(receiver, amount, { gasPrice: 20e9 });
  console.log(`Transaction hash: ${tx.hash}`);
  document.getElementById(
    "transferResponse"
  ).innerText += `Transaction hash: ${tx.hash}`;

  const receipt = await tx.wait();
  */



  /*

  How to make the code for meta-transactions:
  SEE https://docs.biconomy.io/products/enable-gasless-transactions/choose-an-approach-to-enable-gasless/eip-2771/2.-code-changes/sdk

  - Replace userSigner by biconomy.getSignerByAddress(userAddress) when getting the contract
    let userAddress = await signer.getAddress();
    let usdcContract = new ethers.Contract(usdc.address, usdc.abi, biconomy.getSignerByAddress(userAddress));

  - 

  */

  //-------------------------------------  -  New part  -  ---------------------------------------- //

   /* 
  const biconomy = new Biconomy(window.ethereum as ExternalProvider, {
    apiKey: '5oyBzRCJS.cbf1967f-f576-4bb3-ba9a-fa3900f54ea1',
    debug: true,
    contractAddresses: ['0x3D249B8E3eA85F1094Be7701d0D703bA10805A7E'], // list of contract address you want to enable gasless on
  });
  */ 

  let ethersProvider = new ethers.providers.Web3Provider(biconomy);
  let usdcContractB = new ethers.Contract(usdc.address, usdc.abi, biconomy.getSignerByAddress(userAddress)); //Not used at the moment
  let contractInterface = new ethers.utils.Interface(usdc.abi);
  let privateKey = '5oyBzRCJS.cbf1967f-f576-4bb3-ba9a-fa3900f54ea1';
  let userSigner = signer;

  let functionSignature = contractInterface.encodeFunctionData("transfer", [receiver, amount]);
  let rawTx = {
              to: usdc.address,
              data: functionSignature,
              from: userAddress
            };

  let signedTx = await userSigner.signTransaction(rawTx);
  const forwardData = await biconomy.getForwardRequestAndMessageToSign(signedTx);
  console.log(forwardData);      

  // optionally one can sign using sigUtil
  // npm install eth-sig-util --save
  //const signature = sigUtil.signTypedMessage(new Buffer.from(privateKey, 'hex'), { data: forwardData.eip712Format }, 'V3');
  const signature = ''                                                                    

  let data = {
    signature: signature,
    forwardRequest: forwardData.request,
    rawTransaction: signedTx,
    signatureType: biconomy.EIP712_SIGN
  };

  let providerB = biconomy.getEthersProvider();          
  let txHash = await providerB.send("eth_sendRawTransaction", [data]);
  let receipt = await providerB.waitForTransaction(txHash);

  //--------------------------------------------------- End of new part ------------------------------------------------ //




  console.log(`Transaction hash: ${txHash}`);
  console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
  document.getElementById(
    "transferResponse"
  ).innerText += `Transaction confirmed in block ${receipt.blockNumber}`;
}

