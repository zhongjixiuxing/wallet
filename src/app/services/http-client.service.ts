/**
 * 负责使用http client 向外请求。
 * Notice: 此方式仅适用于自己写的服务系统，如果使用别家的服务系统，响应数据不一致。不能处理
 *
 * 使用中间件方式，在请求前、请求后做封装处理
 * 例如：请求日志记录、全局通用错误处理
 *
 * TODO: 此文件一些方式函数没经过严格的单元测试或者实际的使用。
 *
 * @author anxing<anxing131@gmail.com>
 * @date 20190112
 */

import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ConfigService} from './config.service';
import {isEmpty} from 'lodash';
import {tap, timeout} from 'rxjs/internal/operators';
import {PopupService} from './popup.service';
import {Logger} from './logger/logger';
import {WalletModelService} from '../models/wallet-model.service';
import {WORKER_TOPIC} from '../../web-worker/app-workers/shared/worker-topic.constants';
import {WorkerMessage} from '../../web-worker/app-workers/shared/worker-message.model';
import {WebWorkerService} from './web-worker.service';

/***
 *  将json 对象转换成http query 字符串
 *  example : {name:anxing,age:xxx}  => ?name=anxing&age=xxx
 *
 * @param {{}} json
 * @return {string}
 */
const jsonToQueryString = function(json = {}) {
    let attrs = Object.keys(json);
    let query = '';
    for(let i=0; i<attrs.length; i++) {
        let key = attrs[i];
        let attrVal = json[key];
        let head = '&';
        if(i == 0){
            head = '?';
        }

        if(Array.isArray(attrVal)){
            let arrValue = '';
            for(let k=0; k < attrVal.length; k++) {
                if(k === 0){
                    arrValue = attrVal[k];
                    continue;
                }

                arrValue = `${arrValue},${attrVal[k]}`;
            }

            attrVal = arrValue;
        }

        query = `${query}${head}${key}=${attrVal}`;
    }

    return query;
};

@Injectable({
    providedIn: 'root'
})
export class HttpClientService{
    // 服务器响应吗列表
    static Errors: any = {
        Unknown: 'Unknown', // 这个是特殊的错误, 存在app层面，用来处理没有匹配到下面任何错误的情况
        OK: null,
        ServerError: 'ServerError',
        DuplicateRequest: 'DuplicateRequest',
        NotFound: 'NotFound',
        ParamsError: 'ParamsError',
    };

    constructor(
        private config: ConfigService,
        public httpClient: HttpClient,
        private popupService: PopupService,
        private logger: Logger,
        private webWorker: WebWorkerService) {
    }

    /***
     * 获取wallet 简单数据. 如果不存在则创建保存
     *
     * post /v1/wallet
     *
     * @param data
     * @param customErrorHandle
     * @param httpOptions
     * @return {any}
     */
    getWalletInfo(data: any, customErrorHandle: any = {}, httpOptions: any = {}): any {
        let temp = this.config.globalCfg.api.btcGateway;
        let url =  `${temp.prefix}${temp.apis.wallet}`;

        return this.request('post', url, data, customErrorHandle, httpOptions);
    }

    /***
     * 获取wallet 详细数据
     *
     * @param {string} walletId
     * @param customErrorHandle
     * @param httpOptions
     * @return {any}
     */
    getWalletDetail(data: any, customErrorHandle: any = {}, httpOptions: any = {}): any {
        let temp = this.config.globalCfg.api.btcGateway;
        let url =  `${temp.prefix}${temp.apis.wallet}`;

        return this.request('get', url, data, customErrorHandle, httpOptions);
    }

    getWalletNextPath(data: any,  customErrorHandle: any = {}, httpOptions: any = {}){
        let temp = this.config.globalCfg.api.btcGateway;
        let url =  `${temp.prefix}${temp.apis.wallet_next_path}`;

        return this.request('post', url, data, customErrorHandle, httpOptions);
    }

    updateScanFlag(data: any, customErrorHandle: any = {}, httpOptions: any = {}) {
        let temp = this.config.globalCfg.api.btcGateway;
        let url = `${temp.prefix}${temp.apis.update_scan_flag}`;

        return this.request('post', url, data, customErrorHandle, httpOptions);
    }

    listBtcTxs(wallet, params: Array<any>, customErrorHandle:any = {}, httpOptions: any = {}) {
        let url = `${this.config.globalCfg.api.btcRpc}/wallet/${wallet.id}`;
        let data = this.formatBtcRpcParams('listtransactions', params);

        return this.requestForBtcRpc(url, data, customErrorHandle, httpOptions);
    }

    listBtcUnspentTxs(wallet: WalletModelService, params: Array<any>, customErrorHandle:any = {}, httpOptions: any = {}) {
        let url = `${this.config.globalCfg.api.btcRpc}/wallet/${wallet.id}`;
        let data = this.formatBtcRpcParams('listunspent', params);

        return this.requestForBtcRpc(url, data, customErrorHandle, httpOptions);
    }

    sendrawtransaction(wallet: WalletModelService, params: Array<any>, customErrorHandle:any = {}, httpOptions: any = {}) {
        let url = `${this.config.globalCfg.api.btcRpc}/wallet/${wallet.id}`;
        let data = this.formatBtcRpcParams('sendrawtransaction', params);

        return this.requestForBtcRpc(url, data, customErrorHandle, httpOptions);
    }

    /**
     * import btc address to rpc server
     *
     * @param wallet
     * @param {Array<string>} params
     */
    importBtcAddressToRemote(wallet, params: Array<any>, customErrorHandle:any = {}, httpOptions: any = {}) {
        let url = `${this.config.globalCfg.api.btcRpc}/wallet/${wallet.id}`;
        let data = this.formatBtcRpcParams('importaddress', params);

        return this.requestForBtcRpc(url, data, customErrorHandle, httpOptions);
    }

    importMultiBtcAddressToRemote(wallet) {
        let url = `${this.config.globalCfg.api.btcRpc}/wallet/${wallet.id}`;

        let reqData = {
            url,
            jobId: wallet.id,
            mnemonic: wallet.mnemonic
        };

        let workerMessage = new WorkerMessage(WORKER_TOPIC.firstInitBtcWallet, reqData);

        this.webWorker.doWork(workerMessage);

        return this.webWorker.workerUpdate$;
    }

    importMultiBtcAddressToRemote_bk(wallet, params: Array<any>, customErrorHandle:any = {}, httpOptions: any = {}) {
        let url = `${this.config.globalCfg.api.btcRpc}/wallet3/${wallet.id}`;
        let data = this.formatBtcRpcParams('importmulti', params);

        return this.requestForBtcRpc(url, data, customErrorHandle, httpOptions);
    }

    importWallet(wallet: WalletModelService, customErrorHandle:any = {}, httpOptions: any = {}) {
        let url = this.config.globalCfg.api.btcRpc;
        let data = this.formatBtcRpcParams('createwallet', [wallet.id]);

        return this.requestForBtcRpc(url, data, customErrorHandle, httpOptions);
    }

    loadWallet(wallet: WalletModelService, customErrorHandle:any = {}, httpOptions: any = {}) {
        let url = this.config.globalCfg.api.btcRpc;
        let data = this.formatBtcRpcParams('loadwallet', [wallet.id]);

        return this.requestForBtcRpc(url, data, customErrorHandle, httpOptions);
    }

    getTxDetail(wallet: WalletModelService, txid: string,  customErrorHandle:any = {}, httpOptions: any = {}) {
        let url = `${this.config.globalCfg.api.btcRpc}/wallet/${wallet.id}`;
        let data = this.formatBtcRpcParams('gettransaction', [txid]);

        return this.requestForBtcRpc(url, data, customErrorHandle, httpOptions);
    }


    /**
     *
     * @param {string} method
     * @param params
     * @return {{jsonrpc: string; id: string; method: string; params: any}}
     */
    formatBtcRpcParams(method: string, params: any) {
        return {
            jsonrpc: '1.0',
            id: 'curltest',
            method,
            params
        };
    }

    /**
     * 调用远程btc rpc server
     *
     * @param url
     * @param data
     * @param customErrorHandle
     * @param httpOptions
     * @return {any}
     */
    requestForBtcRpc(url, data, customErrorHandle:any = {}, httpOptions: any = {}): any {
        if (!httpOptions.hasOwnProperty('observe')) {
            httpOptions.observe = 'response'; // 返回结果是完整的HttpResponse 对象
        }

        let reqData = {
            url,
            data,
            customErrorHandle,
            httpOptions
        };

        return this.httpClient.post(url, data, httpOptions)
            .pipe(
                timeout(1200000),
                tap(res => this.logDataForBtcRpc(res, reqData), error => this.logErrorForBtcRpc(error, reqData))
            );
    }

    logDataForBtcRpc(res: any, reqData: any) {
        return ; // nothing to do for the time being
    }

    async logErrorForBtcRpc(error: any, reqData: any) {
        if (reqData.customErrorHandle.global) {  // global error
            return ; //正常响应不做任何的处理
        }

        if (!error.hasOwnProperty('error') || !error.hasOwnProperty('status')) {
            this.logger.error('un-support server error format: ', error);
            return;
        }

        if (reqData.customErrorHandle.status && reqData.customErrorHandle.status.hasOwnProperty(error.status)) {
            let customErrorHandle = reqData.customErrorHandle.status[error.status];
            if (typeof customErrorHandle === 'function') {
                if (await customErrorHandle(error) === true) {  // 自定义匹配逻辑
                    return; // 匹配成功 调用者自己处理
                }
            } else {
                return; // 匹配成功 调用者自己处理
            }
        }

        let errorMsg;
        switch (error.status) {
            case 401: // 未授权
            case 407: // 需要代理授权
                errorMsg = 'Unauthorized';
                break;

            case 403: // 禁止
                errorMsg = 'Deny';
                break;
            case 404: // Not Found
                errorMsg = 'Not Found';
                break;

            case 408: // 请求超时
                errorMsg = 'Timeout';
                break;

            case 400: // 错误请求
            case 405: // 方法禁用
            case 406: // 不接受
            case 409: // 冲突
            case 410: // 已删除
            case 411: // 需要有效长度
            case 412: // 为满足前提条件
            case 413: // 请求实体过大
            case 414: // 请求的URI过长
            case 415: // 不支持的媒体类型
            case 416: // 请求范围不符合要求
            case 417: // 为满足期望值
                errorMsg = '4xx-Error';
                break;

            case 429:
                errorMsg = 'Request Frequently';
                break;

            case 500: // 服务器内部错误
            case 501: // 尚未实施
            case 502: // 错误网关
            case 503: // 服务不可用
            case 504: // 网关超时
            case 505: // http 版本不受支持
                errorMsg = 'Internal Server Error';
                break;
            default:
                errorMsg = 'Unknown Internal Server Error';
                break;
        }

        this.alertError(`${errorMsg} [${error.status}]`, error.error);
        this.logger.error(`http client request error, [${error.status}]`, error);
    }



    /***
     *  不支持jsonpa

     * @param method
     * @param url
     * @param data
     * @param customErrorHandle
     * @param httpOptions
     * @return {any}
     */
    request(method, url, data:any = {}, customErrorHandle:any = {}, httpOptions: any = {}): any {
        if (!httpOptions.hasOwnProperty('observe')) {
            httpOptions.observe = 'response'; // 返回结果是完整的HttpResponse 对象
        }

        let reqData = {
            method,
            url,
            data,
            customErrorHandle,
            httpOptions
        };

        switch (method.toLowerCase()) {
            case 'delete':
            case 'get':
            case 'head':
            case 'options':
                httpOptions.params = data;

                return this.httpClient[method](url, httpOptions)
                    .pipe(
                        tap(data => this.logData(data, reqData), error => this.logError(error, reqData))
                    );

                break;

            case 'post':
            case 'patch':
            case 'put':
                return this.httpClient[method](url, data, httpOptions)
                    .pipe(
                        tap(res => this.logData(res, reqData), error => this.logError(error, reqData))
                    );
                break;
                
            default: 
                throw new Error('un-support request method: ' + method);
        }
    }

    /**
     * 处理/记录响应数据
     *
     * @param data
     * @param reqData
     */
    private async logData(res: any, reqData: any) {
        if (reqData.customErrorHandle.global) {  // global error
            return ; //正常响应不做任何的处理
        }

        if (!res.hasOwnProperty('body') || !res.body.hasOwnProperty('err') || !res.body.hasOwnProperty('data')) {
            this.logger.error('un-support server response data format: ', res);
            return;
        }

        if (res.body.err === HttpClientService.Errors.OK) {
            return; //正常响应不做任何的处理
        }

        if (reqData.customErrorHandle.app && reqData.customErrorHandle.app.hasOwnProperty(res.body.err)) {
            let customErrorHandle:any = reqData.customErrorHandle.app[res.body.err];
            if (typeof customErrorHandle === 'function') {
                if (await customErrorHandle(res) === true) {  // 自定义匹配逻辑
                    return; // 匹配成功 调用者自己处理
                }
            } else {
                return; // 匹配成功 调用者自己处理
            }
        }

        switch (res.body.err) {
            case HttpClientService.Errors.ServerError:
                this.toastError('Internal Server Error');
                break;
            case HttpClientService.Errors.DuplicateRequest:
                this.toastError(`Can't Duplicate Request`);
                break;

            case HttpClientService.Errors.NotFound:
                this.toastError(`Request Resource Not Found`);
                break;

            case HttpClientService.Errors.ParamsError:
                this.toastError('Request Parameters Error');
                break;

            default:
                if (reqData.customErrorHandle.app && reqData.customErrorHandle.app.hasOwnProperty(HttpClientService.Errors.Unknown)) {
                    let customErrorHandle: any = reqData.customErrorHandle.app.Unknown;
                    if (typeof customErrorHandle === 'function') {
                        if (await customErrorHandle(res) === true) {  // 自定义匹配逻辑
                            return; // 匹配成功 调用者自己处理
                        }
                    } else {
                        return; // 匹配成功 调用者自己处理
                    }
                }

                this.toastError('Unknown Error: ' + res.body.err);
                break;
        }

        this.logger.error(`http client request error, [${res.body.err}]`, res);
    }

    /**
     * 处理/记录错误
     *
     * @param error
     * @param reqData
     */
    private async logError(error: any, reqData: any) {
        if (reqData.customErrorHandle.global) {  // global error
            return ; //正常响应不做任何的处理
        }

        if (!error.hasOwnProperty('error') || !error.hasOwnProperty('status')) {
            this.logger.error('un-support server error format: ', error);
            return;
        }

        if (reqData.customErrorHandle.status && reqData.customErrorHandle.status.hasOwnProperty(error.status)) {
            let customErrorHandle = reqData.customErrorHandle.status[error.status];
            if (typeof customErrorHandle === 'function') {
                if (await customErrorHandle(error) === true) {  // 自定义匹配逻辑
                    return; // 匹配成功 调用者自己处理
                }
            } else {
                return; // 匹配成功 调用者自己处理
            }
        }

        let errorMsg;
        switch (error.status) {
            case 401: // 未授权
            case 407: // 需要代理授权
                errorMsg = 'Unauthorized';
                break;

            case 403: // 禁止
                errorMsg = 'Deny';
                break;
            case 404: // Not Found
                errorMsg = 'Not Found';
                break;

            case 408: // 请求超时
                errorMsg = 'Timeout';
                break;

            case 400: // 错误请求
            case 405: // 方法禁用
            case 406: // 不接受
            case 409: // 冲突
            case 410: // 已删除
            case 411: // 需要有效长度
            case 412: // 为满足前提条件
            case 413: // 请求实体过大
            case 414: // 请求的URI过长
            case 415: // 不支持的媒体类型
            case 416: // 请求范围不符合要求
            case 417: // 为满足期望值
                errorMsg = '4xx-Error';
                break;

            case 429:
                errorMsg = 'Request Frequently';
                break;

            case 500: // 服务器内部错误
            case 501: // 尚未实施
            case 502: // 错误网关
            case 503: // 服务不可用
            case 504: // 网关超时
            case 505: // http 版本不受支持
                errorMsg = 'Internal Server Error';
                break;
            default:
                errorMsg = 'Unknown Internal Server Error';
                break;
        }

        this.alertError(`${errorMsg} [${error.status}]`, error.error);
        this.logger.error(`http client request error, [${error.status}]`, error);
    }

    /***
     * show toast window in 1s
     *
     * @param {string} text
     */
    private toastError(text: string) {
        let config = {
            color: 'danger',
            position: 'middle',
            duration: 1000,
            message: text
        };

        this.popupService.ionicCustomToast(config);
    }

    /***
     * show alert windon on 1s
     *
     * @param title
     * @param {string} text
     * @return {Promise<void>}
     */
    private async alertError(title: string, text: string) {
        let opts = {
            backdropDismiss: false,
            header: title,
            message: text,
            mode: 'ios'
        };

        let alert = await this.popupService.ionicCustomAlert(opts);

        setTimeout(() => {
            alert.dismiss();
        }, 1000)
    }
}