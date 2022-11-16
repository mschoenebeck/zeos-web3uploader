const fetch = require('node-fetch');
const FormData = require('form-data');
const http = require('http');
//const fs = require('fs');

(async () => {
    const form = new FormData();
    form.append('strupload', '12345');
    const uploadResponse = await fetch('http://web3.zeos.one/uploadstr', {method: 'POST', body: form });
    console.log(await uploadResponse.text());
})();
