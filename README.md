## 🚀 Meme unstake
Скрипт анстейкает $MEME на сайте [Stakeland](https://www.stakeland.com/farming). Я не придумал, что с ними делать (свапать или собирать куда - то на биржу), но пока газ на низах - можно пособирать.

Связь с создателем: https://t.me/CryptoBusher <br>
Если ты больше по Твиттеру: https://twitter.com/CryptoBusher <br>

Залетай сюда, чтоб не пропускать дропы подобных скриптов: https://t.me/CryptoKiddiesClub <br>
И сюда, чтоб общаться с крутыми ребятами: https://t.me/CryptoKiddiesChat <br>

## 📚 Первый запуск
1. Устанавливаем [NodeJs](https://nodejs.org/en/download)
2. Скачиваем проект, в терминале, находясь в папке проекта, вписываем команду "npm i" для установки всех зависимостей
3. Настраиваем "config.js":
    1. shuffleWallets - перемешать порядок кошельков (true / false)
    2. minDelaySec - минимальная задержка между кошельками (в секундах)
    3. maxDelaySec - максимальная задержка между кошельками (в секундах)
    4. ethRpc - нода, можно оставить дефолтную
    5. gasPrices:
        1. startMainnetGwei - значение GWEI с которого начинается ожидание газа (если газ выше - скрипт ждет)
        2. step - значение startMainnetGwei будет увеличиваться на указанную величину
        3. delayMinutes - с какой скоростью будет расти startMainnetGwei (минуты)
        4. maxMainnetGwei - предел роста startMainnetGwei
4. Вносим данные в текстовик "wallets.txt" в формате "name|address|privateKey|httpProxy". Прокси в формате http://user:pass@host:port. Если не хотите использовать прокси для конкретного кошелька, то формат будет "name|privateKey". Каждый кошелек с новой строки.
5. Запускаем скрипт командой "node memeUnstake.js". Если запускаетесь на сервере - "npm run start", тогда просмотреть лог можно в файле "out.log", а отслеживать в консоли прогресс можно командой "tail -f out.log".
