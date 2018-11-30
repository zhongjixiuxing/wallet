
export enum Coin {
    BTC = 'btc',
    BCH = 'bch',
    ETH = 'eth',
    EOS = 'eos',
    ERC20 = 'erc20'
};

export class WalletModelService {

  /*
    wallet uuid flag
    if wallet is new wallet and don't storage, _uuid is undefined!
   */
  id: number;

  isBackup: boolean = false;

  mnemonic: String;

  //
  password: String;

  name: String;

  coins: Array<Coin> = [];

  constructor(option) {
      if (option.hasOwnProperty('mnemonic') || option.hasOwnProperty('seed')) {
          Object.assign(this, option);
      }
  }

  toJson() {

  }
}
