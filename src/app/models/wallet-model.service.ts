import * as bitcoin from 'bitcoinjs-lib';
import * as Bip39 from 'bip39';
import * as Bip32 from 'bip32';
import {last, indexOf, lastIndexOf, remove, isEmpty} from 'lodash';
import {AddressModelService} from './address-model.service';
import * as uuid from 'uuid/v4';
import * as Md5 from 'js-md5';

export enum Coin {
    BTC = 'BTC',
    BCH = 'BCH',
    ETH = 'ETH',
    EOS = 'EOS',
    ERC20 = 'ERC20'
};

export class CoinCfg {
    isFirstFullScan: boolean = false;
    currentPath: string;
    currentReceiveAddress: string;
    lastSyncTxsTs: number = 0; //最近一次同步tx的时间
    lastTxTs: number = 0; // 最近的tx 产生时间
    txs: Array<any> = [];

    constructor(option) {
        Object.assign(this, option);
    }
}

export class WalletModelService {

    /*
      wallet uuid flag
      if wallet is new wallet and don't storage, _uuid is undefined!
     */
    id: string;

    isBackup: boolean = false;

    mnemonic: string;

    currentCoin: Coin = Coin.BTC;

    currentPath: string;

    currentReceiveAddress: string;

    //
    password: string;

    name: string;

    coins: Map<Coin, CoinCfg> = new Map<Coin, CoinCfg>();

    recipients: Array<AddressModelService> = [];

    amount: any = '0';


    constructor(option) {
        if (option.hasOwnProperty('mnemonic') || option.hasOwnProperty('seed')) {
            Object.assign(this, option);
        }

        this.init();
    }

    init() {
        if (!this.currentPath) {
            switch (this.currentCoin) {
                case Coin.BTC:
                    this.currentPath = 'm/44\'/1\'/0\'/0/0';
                    this.currentReceiveAddress = this.createAddress(this.currentPath, Coin.BTC, {
                        updateCurrentPath: false,
                        updateCurrentAddress: false
                    });
                    break;
            }
        }
    }


    /**
     *
     * @param {string} path
     * @param {Coin} coin
     * @return {boolean | string} if ok will return true, if error will return string format error message
     */
    static validatePath(path: string, coin: Coin): boolean | string {
        if (path.startsWith('m') === false) {
            return 'InvalidStart_m';
        }

        let pathSlit = path.split('/');
        if (pathSlit.length !== 6) {
            return 'InvalidLength';
        }

        let purpose = pathSlit[1];
        if (purpose.length < 3 || purpose.endsWith('\'') !== true || indexOf(['44', '49'], `${purpose.split('\'')[0]}`) === -1) {
            return 'InvalidPurpose'; // only support bip44、bip49
        }

        let change = pathSlit[4];
        if (indexOf(['0', '1'], `${change.split('\'')[0]}`)) {
            return 'InvalidChange';
        }

        return true;
    }


    createAddress(path: string, coin: Coin = Coin.BTC, opts: any = {updateCurrentPath: false, updateCurrentAddress: false}): string {
        if (!coin) {
            coin = this.currentCoin;
        }

        switch (coin) {
            case Coin.BTC:
                return this.createBtcAddress(path, opts);
                break;

            default:
                throw new Error(`Un-support Coin[${coin}]`);
        }
    }

    /***
     *
     *
     * Notice:
     *  opts.updateCurrentPath, updateCurrentAddress 这两个属性为true时，必须要初始化对应的CoinCfg
     *
     * @param path
     * @param opts
     * @return {string}
     */
    createBtcAddress(path, opts: any = {updateCurrentPath: false, updateCurrentAddress: false}): string {
        let seed = Bip39.mnemonicToSeed(this.mnemonic);

        const root = Bip32.fromSeed(seed);

        const account = root.derivePath(path);

        if (opts && opts.hasOwnProperty('updateCurrentPath') && opts.updateCurrentPath) {
            this.currentPath = path;
            let coinCfg = this.coins.get(Coin.BTC);
            coinCfg.currentPath = path;
        }

        let address = bitcoin.payments.p2pkh({pubkey: account.publicKey, network: bitcoin.networks.testnet}).address;
        if (opts && opts.hasOwnProperty('updateCurrentAddress') && opts.updateCurrentAddress) {
            this.currentReceiveAddress = address;
            let coinCfg = this.coins.get(Coin.BTC);
            coinCfg.currentReceiveAddress = address;
        }

        return address;
    }

    /**
     * 参考createAddress Opts param
     */
    getNextAddress(opts: any): any {
        let pathSplit = this.currentPath.split('/');
        let latestPath = parseInt(last(pathSplit));
        latestPath = latestPath + 1;

        pathSplit.pop();
        let prefixPath = pathSplit.join('/');

        let path = `${prefixPath}/${latestPath}`;

        let address = this.createBtcAddress(path, opts);

        return {address, path};
    }

    addRecipient(data) {
        let address = new AddressModelService();

        address.id = uuid();
        address.tag = data.tag;
        address.address = data.address;

        this.recipients.push(address);
    }

    deleteRecipient(recipient) {
        remove(this.recipients, (item) => {
            return item.id === recipient.id;
        });
    }

    updateRecipient(recipient) {
        this.recipients.forEach((recipientFor, index) => {
            if (recipientFor.id === recipient.id) {
                this.recipients[index] = recipient;
            }
        });
    }

    static validMnemonic(mnemonic: string): boolean {
        return Bip39.validateMnemonic(mnemonic);
    }

    /**
     * 根据mnemonic 获取唯一的hash字符串
     *
     * @param {string} mnemonic
     * @return {string}
     */
    static getSoleHash(mnemonic: string): string {
        const seedHex = Bip39.mnemonicToSeedHex(mnemonic);


        const seed = Bip39.mnemonicToSeed(mnemonic);
        const root = bitcoin.bip32.fromSeed(seed, bitcoin.networks.testnet);
        const node = root.derivePath("m/44'/1'/0'/0");

        /**
         *  BIP32 extended public key
         */
        const publicKey = node.neutered().toBase58();

        let randMixStr = publicKey.charAt(publicKey.length - 1);
        randMixStr =  randMixStr + publicKey.charAt(publicKey.length - 3);
        randMixStr =  randMixStr + publicKey.charAt(publicKey.length - 5);
        randMixStr =  randMixStr + publicKey.charAt(publicKey.length - 7);
        randMixStr =  randMixStr + publicKey.charAt(publicKey.length - 9);

        /**
         *  增加randMixStr 指纹，避免出现重复
         */
        return `${Md5(seedHex)}${randMixStr}`;
    }


}