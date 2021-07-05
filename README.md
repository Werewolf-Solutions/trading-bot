This is the trading-bot software of [Werewolf app](https://werewolf.solutions).

# What can you do?

1. use the [strategies available](https://werewolf.solutions) that you can find in [Werewolf app](https://werewolf.solutions) but run it locally.

        const user = {
            strategies: [{
                name: 'grid,
                type_: 'grid',
                depth: 2,
                volume: 2,
                amount_allocated: 12,
                currency: 'USD',
                n_grids: 6
            }],
            tradingBots: [{
                ...,
                strategy: {
                    name: 'test1',
                    type_: 'grid'
                },
                mode: 'paper-trader',
                status: 'off',
                exchanges: ['crypto.com']
            }],
            exchanges: [{
                name: 'crypto.com',
                api_pub: CRYPTO_PUB_API_KEY,
                api_sec: CRYPTO_SEC_API_KEY,
            }]
        }

2. write your own strategy and bot using the software always updated from the team and run it locally. You can find all strategies in ```/lib/trading-bot/strategies/strategies.js```, just add your own at the end.

3. write a new strategy/bot, refer to **how to collaborate**.

4. write a new exchange-connection, refer to **how to collaborate**.

5. improve code, refer to **how to collaborate**.

##### Requirements

- [node](https://t.me/)
- [git](https://t.me/)
- javascript, api knowledge if you want to write code

# How to download and start it

1. In your choosen folder clone the repository

    ```git clone https://github.com/Oznerol92/trading-bot```

2. Install all the dependecies

    ```npm install```

3. Change what you need to change, refer to **what can you do?** section

4. Open .env_sample with a text editor

    ```nano .env_sample```

5. Put your api_keys and rename the file in .env

6. Run app in dev mode, restarts on changes

    ```npm run dev```

7. Run app in production mode

    ```npm start```

# How to collaborate

1. Join telegram group: [Werewolf Dev ENG](https://t.me/), [Werewolf Dev ITA](https://t.me/).

2. On Trello or in the groups search if someone is working on the same or something similar. If not open a01 card template and create your own card and put yourself as a member. If someone is working on something similar just open the card and in the description it will be dev's contacts.

3. After you finished to write your amazing card or you joined one, create or clone a branch with the same name and you are good to go.

    -   if you join an existing branch just clone that branch (does it work??)

    -   if you create your own download the repository, refer to **how to download and start it**, and create your own branch and when you are ready make a pull request (to be tested)

Happy hacking!

#### Example feature on Trello

![](files/example-Trello.png)

![](files/example_feature.png)

>key_feature = a01

### Notes:

TODO: put screenshots or video tutorial links

```git branch name_branch``` | creates a new branch name_branch

```git branch -d name_branch``` | delete  name_branch

```git status``` | check branch status

```git add .``` | add all new changes

```git commit -m 'your changes'``` | commit new changes to branch

```git remote add origin https://github.com/username/repository``` | add repository to git remote

```git push -u origin key_feature``` | push new branch

```git remote``` | check name of repository in remote

```git branch``` | check what branch you are working on

---