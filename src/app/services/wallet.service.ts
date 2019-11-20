import { Injectable } from '@angular/core';
import {Coin, WalletModelService} from '../models/wallet-model.service';
import {HttpClientService} from './http-client.service';
import {isEmpty} from 'lodash';
import * as uuid from 'uuid/v4';
import * as Bip39 from 'bip39';
import * as Bip32 from 'bip32';
import * as bitcoin from 'bitcoinjs-lib';
import {Logger} from './logger/logger';
import {WebWorkerService} from './web-worker.service';
import {difference} from 'lodash'
;
@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private wallets: WalletModelService[] = [];
  constructor(private httpClient: HttpClientService,  private logger: Logger, private webWorker: WebWorkerService) {}

  createWallet() {
    let mnemonic = this.generateMnemonic();

    return new WalletModelService({mnemonic})
  }

  createWalletFromMnemonic () {}

  generateMnemonic() {
    return Bip39.generateMnemonic()
  }

  addWallet(wallet) {
    this.wallets[wallet.id] = wallet;
  }

  decrypt(wallet, password) {}

  encrypt(wallet, password) {}

  import(opts) {}

  export(wallet) {}


  getWalletAddressPath(wallet: WalletModelService, coin: Coin,  addresses: Array<string>) {
      switch (coin) {
          case Coin.BTC:
              return this.getBtcWalletAddressPath(wallet,  addresses);
              break;

          default:
              throw new Error()
      }
  }

  getBtcWalletAddressPath(wallet: WalletModelService, addresses: Array<string>) {

      let mapAddrresses: any = {};

      let seed = Bip39.mnemonicToSeed(wallet.mnemonic);

      const root = Bip32.fromSeed(seed);

      const coinCfg = wallet.coins.get(Coin.BTC);

      let lastIndex: any = coinCfg.currentPath.split('/');
      lastIndex = lastIndex[lastIndex.length - 1];

      for (let i=lastIndex; i>=0; i--) {
          let path = 'm/44\'/1\'/0\'/0/'+i;

          const account = root.derivePath(path);
          let address = bitcoin.payments.p2pkh({pubkey: account.publicKey, network: bitcoin.networks.testnet}).address;

          if (addresses.indexOf(address) !== -1) {
              mapAddrresses[address] = {
                  path,
                  privKey: account.privateKey
              };

              if (mapAddrresses.length === addresses.length) {
                  break; // 已经全部匹配完成了
              }
          }
      }
      if (Object.keys(mapAddrresses).length !== addresses.length) {
          let keys1 = Object.keys(mapAddrresses);
          let keys2 = Object.keys(addresses);
          let notMapAddresses = difference(keys1, keys2);

          this.logger.error(`[WalletService.getBtcWalletAddressPath] AddressesNotMap: `, {
              notMapAddresses,
              id: wallet.id
          });
          throw new Error('AddressesNotMap');
      }

      return mapAddrresses;
  }


    /**
     * 根据soleHash 获取服务端的钱包信息
     * 如果在服务端soleHash不存在，则自动分配新建一个id信息
     *
     * @param {string} soleHash
     * @param {string} walletName∂
     * @param {string} walletId
     *
     * @return Promise<any>
     */
  getWalletInfoBySoleHash(soleHash:string, walletName: string = '',  walletId: string = null, customErrorHandle: any = {}, httpOptions: any = {}): Promise<any> {
      return new Promise((resolve, reject) => {
          let data:any = {
              hash: soleHash,
              name: walletName || 'wallet',
              id: walletId || uuid()
          };

          this.httpClient.getWalletInfo(data, customErrorHandle, httpOptions)
              .subscribe(
                  res => {
                      resolve(res);
                  },
                  err => {
                      reject(err);
                  }
              )
      });
  }

    /**
     *
     *
     * @param {string} id
     * @param customErrorHandle
     * @param httpOptions
     * @return {Promise<any>}
     */
  getRemoteWalletDetail(id: string | any, customErrorHandle: any = {}, httpOptions: any = {}): Promise<any> {
      return new Promise((resolve, reject) => {
          this.httpClient.getWalletDetail({id}, customErrorHandle, httpOptions)
              .subscribe(
                  res => {
                      resolve(res);
                  },
                  err => {
                      reject(err);
                  }
              )
      })
  }

  getTx(wallet: WalletModelService, txid: string, customErrorHandle: any = {}, httpOptions: any = {}): Promise<any> {
      return new Promise((resolve, reject) => {
          this.httpClient.getTxDetail(wallet, txid, customErrorHandle, httpOptions)
              .subscribe(
                  res => resolve(res),
                  err => reject(err)
              );
      })
  }

  getRawTransaction(txid: string, customErrorHandle: any = {}, httpOptions: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
        this.httpClient.getRawTransaction(txid, customErrorHandle, httpOptions)
            .subscribe(
                res => resolve(res),
                err => reject(err)
            );
    })
  }

    /**
     * 获取钱包的下一个路径。
     *
     * @param {WalletModelService} wallet
     * @return {Promise<any>}
     */
  getWalletNextPath(wallet: WalletModelService, customErrorHandle: any = {}, httpOptions: any = {}): Promise<any> {
      return new Promise((resolve, reject) => {
          let data = {
              walletId: wallet.id,
              coin: wallet.currentCoin
          };

          this.httpClient.getWalletNextPath(data, customErrorHandle, httpOptions)
              .subscribe(
                  res => resolve(res),
                  err => reject(err)
              );
      })
  }

    updateScanFlag(wallet: WalletModelService, coin: Coin, path: string = null,  customErrorHandle: any = {}, httpOptions: any = {}): Promise<any> {
      return new Promise<any>((resolve, reject) => {
          let data: any = {
              walletId: wallet.id,
              coin
          };

          if (!isEmpty(path)) {
              data.path = path;
          }

          this.httpClient.updateScanFlag(data, customErrorHandle, httpOptions)
              .subscribe(
                  res => resolve(res),
                  err => reject(err)
              )
      })
    }



  importWallet(wallet, customErrorHandle: any = {}, httpOptions: any = {}): Promise<any> {
      return new Promise<any>((resolve, reject) => {
          this.httpClient.importWallet(wallet, customErrorHandle, httpOptions)
              .subscribe(
                  res => resolve(res),
                  err => reject(err)
              )
      });
  }

  loadWallet(wallet, customErrorHandle: any = {}, httpOptions: any = {}) {
      return new Promise<any>((resolve, reject) => {
          this.httpClient.loadWallet(wallet, customErrorHandle, httpOptions)
              .subscribe(
                  res => resolve(res),
                  err => reject(err)
              )
      });
  }

  getBtcTxs(wallet, params: Array<any>, customErrorHandle: any = {}, httpOptions: any = {}) {
      return new Promise((resolve, reject) => {
          this.httpClient.listBtcTxs(wallet, params, customErrorHandle, httpOptions)
              .subscribe(
                  res => resolve(res),
                  err => reject(err)
              )
      });
  }

  listBtcUnspentTxs(wallet, customErrorHandle: any = {}, httpOptions: any = {}): Promise<any>{
      return new Promise((resolve, reject) => {
          let params = [0, 9999999, [], true];
          this.httpClient.listBtcUnspentTxs(wallet, params, customErrorHandle, httpOptions)
              .subscribe(
                  res => resolve(res),
                  err => reject(err)
              );
      });
  }

  sendrawtransaction(wallet, txHex: string, customErrorHandle: any = {}, httpOptions: any = {}): Promise<any> {
      return new Promise((resolve, reject) => {
          let params = [txHex];
          return this.httpClient.sendrawtransaction(wallet, params, customErrorHandle, httpOptions)
              .subscribe(
                  res => resolve(res),
                  err => reject(err)
              )
      })
  }

  importBtcAddressToRemote(wallet, address: string, label: string = '', rescan: boolean = null ): Promise<any> {
      return new Promise((resolve, reject) => {
          let data = [
              address,
              label ? label : '',
              rescan ? rescan :   false
          ];


          this.httpClient.importBtcAddressToRemote(wallet, data)
              .subscribe(
                  res => resolve(res),
                  err => reject(err)
              );
      });
  }

    /***
     * 初始化wallet 默认的coin，适用于wallet没有任何的coin的情况下
     *
     * @param wallet
     */
  initWalletFirstCoin(wallet: WalletModelService, customErrorHandle: any = {}, httpOptions: any = {}): Promise<any> {
      wallet.currentCoin = Coin.BTC; //默认是btc
      return this.getWalletNextPath(wallet, customErrorHandle, httpOptions);
  }

    /**
     * 新钱包导入，后台异步执行初始化数据
     *
     * @param {WalletModelService} wallet
     */
    async firstInit(wallet: WalletModelService, index: number = 0) {
        if (wallet.currentCoin !== Coin.BTC) {
            return ; // 当前只支持BTC
        }

        this.importMultiBtcAddressToRemote(wallet);
        // let result = await this.importMultiBtcAddressToRemote(wallet);
    }


    // importMultiBtcAddressToRemote(wallet: WalletModelService): Promise<any> {
    importMultiBtcAddressToRemote(wallet: WalletModelService) {
        this.httpClient.importMultiBtcAddressToRemote(wallet);
    }
}
