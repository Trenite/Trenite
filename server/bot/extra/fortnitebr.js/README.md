# fortnitejs
Simple fortnite client to access Fortnite's API. Work in progress.

# Installation
```
npm i fortnitebr.js@1.0.0 -l --save
```

# Example
Example: 
```javascript
const Fortnite = require('@thisnils/fortnitejs');
const fnbot = new Fortnite.Client({
    email: "youremail@github.com",
    password: "12345",
    debug: true
});

fnbot.once('ready', async () => {
    console.log(await fnbot.getProfile("Juergenrossovic"));
    console.log(await fnbot.getNews('battleroyale', 'en'));
    console.log(await fnbot.getServerStatus());
    console.log(await fnbot.getPendingFriends());
    console.log(await fnbot.getFriends());
    console.log(await fnbot.getFriendStatus('4b12804e77064e4db5117850c0e9c55c'))
    await fnbot.waitForEvent('friend:message', 5000).then(m => console.log(m));
    await fnbot.sendFriendMessage('4b12804e77064e4db5117850c0e9c55c', 'Hello wanna play Fortnite with me?');
    await fnbot.addFriend('Nils');
    await fnbot.removeFriend('Nils');
    await fnbot.blockFriend('Nils');
    await fnbot.unblockFriend('Nils');
    await fnbot.setStatus('Battle Royale Lobby - 1 / 16');
});

fnbot.on('friend:request', async (freq) => {
    await freq.accept();
});

fnbot.login();
```

# License
MIT License

Copyright (c) 2020 ThisNils

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
