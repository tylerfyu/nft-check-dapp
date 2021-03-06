export async function submitForm(
  email: string,
  ethAddress: string,
  signature: string
): Promise<
  | {
      ethAddress: string;
      email: string;
      signature: string;
      timestamp: string;
    }
  | { message: string }
> {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  console.log("signature", signature);
  var raw = JSON.stringify({
    email: email,
    ethAddress: ethAddress,
    signature: signature,
  });

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    // redirect: 'manual'
  };

  return new Promise((res, rej) => {
    fetch(
      "https://cadudtdnx4.execute-api.eu-west-2.amazonaws.com/prod/",
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => res(JSON.parse(result)))
      .catch((error) => rej(error));
  });
}
