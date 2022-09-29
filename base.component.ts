
import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { LoginInfoService } from 'src/app/services/common/login-info.service';
import { MenuService } from 'src/app/services/common/menu.service';
import { WebService } from 'src/app/services/common/webservice.service';
import { LedService } from 'src/app/services/common/led.service';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { SystemEntityService } from 'src/app/services/common/system-entity.service';
import { MessageService } from 'src/app/services/common/message.service';
import { Ultility } from 'src/app/services/common/ultility.service';
import { AppService } from 'src/app/services/common/app.service';
import { loginItemNm } from 'src/app/common/DefaultItemnm';
import { DisplayScreenID } from 'src/app/common/DisplayScreenId';
import { IObjectString } from 'src/app/common/IObject';
import { $timeout } from 'src/app/common/Time';
import * as Const from '../../../common/Const';
import { HeaderService } from 'src/app/services/common/header.service';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.css']
})
export abstract class BaseComponent implements OnInit, OnDestroy {

  constructor(
    protected loginInfo: LoginInfoService,
    protected webService: WebService,
    protected menu: MenuService,
    protected ledService: LedService,
    protected router: Router,
    protected systemEntity: SystemEntityService,
    protected messageEntity: MessageService,
    protected injector: Injector
  ) {
    // this.router.events.forEach((event) => {
    //   if(event instanceof NavigationEnd) {
    //     alert("NavigationEnd")
    //   }
    //   console.log(event);
    //   // NavigationEnd
    //   // NavigationCancel
    //   // NavigationError
    //   // RoutesRecognized
    // });
  }

  /**
   * エラーメッセージ
   */
  errorMessage: IObjectString = {};

  /**
   * 画面項目名のリスト
   */
  formItemNm: IObjectString = {};

  /**
   * 画面項目名のリスト
   */
   defaultvalue: IObjectString = {};

  /**
   * 画面ID
   */

  abstract DisplayScreenID: DisplayScreenID;

  /**
   * 初期化
   */
  ngOnInit(): void {


    $timeout(async () => {

      // 項目名マスタ取得処理実施
      if (this.loginInfo.isLogin() == false) {
        this.router.navigate(["/Login"]);
        return;
      }

      // Clear store service
      if (DisplayScreenID.SPCM00101 == this.DisplayScreenID) {
        // Clear all store service
        for (const storeService of Const.ListStoreService) {
          this.injector.get(storeService).clear();
        }
        // Clear menu service
        this.injector.get(MenuService).clear();
      }

      await this.fnSetFormItemNm();

    });
  }

  /**
   * 画面から離れる時呼び出される
   */
  ngOnDestroy(): void {
    this.fnDestroy();
  }

  /**
   * メニューから同じ画面を表示
   */
  fnInitFromMenu() {
    $timeout(() => {
      this.fnInit(true);
    });
  }


  /**
   * 項目名マスタから項目名を取得する
   */
  async fnSetFormItemNm() {

    var request: IObjectString = { accessInfo: this.loginInfo.getAccessInfo(this.DisplayScreenID) };
    request['tmt340SearchCondition'] = {
      'SCRNID': this.DisplayScreenID
    };
    console.log(this.DisplayScreenID)

    return this.webService.callSilentWs(Const.tmt340SearchWs, request, (response) => {
      this.formItemNm = {};
      this.defaultvalue = {};
      response.rows.forEach((row: { SEQNO: string; FORMITEMNM: string; DEFAULTVALUE: string}) => {
        this.formItemNm[row.SEQNO] = row.FORMITEMNM;
        this.defaultvalue[row.SEQNO] = row.DEFAULTVALUE;
      });
      

      // Display title
      var data: IObjectString = {};

      data["HEADERDISPLAY"] = true;
      data["BACKMENUDISPLAY"] = this.DisplayScreenID == DisplayScreenID.SPCM00201 ? false : true;
      data["LOGOUT"] = loginItemNm[Const.langType].logout;
      data["USRNM"] = this.loginInfo.usrnm;
      data["CSTMNM"] = this.loginInfo.cstmnm;
      data["BRNCHNM"] = this.loginInfo.brnchnm;
      this.injector.get(AppService).toggle(data);

      var headerData: IObjectString = {};
      headerData["SCREENTITLE"] = this.formItemNm[0];
      headerData["USRNM"] = this.loginInfo.usrnm;
      headerData["CSTMNM"] = this.loginInfo.cstmnm;
      headerData["BRNCHNM"] = this.loginInfo.brnchnm;
      this.injector.get(HeaderService).showtitle(headerData);

      const activeMenu = document.querySelectorAll(".sidenav-child");
      activeMenu.forEach(activeLink => {
        activeLink.classList.remove("active");
      });
      if(location.hash != "#/SPMK00401") {
        document.querySelector("#" + location.hash.replace("#/", ""))!.classList.add("active");
      }
      this.fnInit(false);
    });

  }

  /**
   * 初期化処理。
   * メニューからの再表示の際も呼び出される
   * @param isMenu メニューアイテムがクリックされた場合true
   */
  abstract fnInit(isMenu: boolean): any;

  /**
   * 画面から離れる時の処理
   */
  abstract fnDestroy(): any;

  /**
   * エラーメッセージの表示をクリアします。
   */
  fnClearMessage() {
    this.errorMessage = {};
  }

  getErrorMessage(errId: string) {
    return this.messageEntity.message[errId];
  }

  getSystemEntity(key: string) {
    return this.systemEntity.value[key];
  }

  backToMenu() {
    this.router.navigate([DisplayScreenID.SPCM00201]);
  }

  fnSetFormItemList(formItemId: string, formItemNm: string, formItemList: any) {
    var newObj = {
      formItemId: formItemId,
      formItemNm: formItemNm
    }
    formItemList.push(newObj);
    return formItemList;
  }

  notifyConfirm(appService: AppService, message: string, okFunction: any, cancelFunction: any) {
    var lang = Ultility.isEmpty(this.loginInfo.lang) ? Const.langType : this.loginInfo.lang;
    var header: IObjectString = this.getNotifyHeader(lang);

    let modalContext = {
      'type': 'confirm',
      'style': 'success',
      'title': header['confirm'],
      'content': message,
      'OkFunction': okFunction,
      'cancelFunction': cancelFunction
    }
    appService.modal(modalContext);
  }

  notifyInfo(appService: AppService, message: string, okFunction: any) {
    var lang = Ultility.isEmpty(this.loginInfo.lang) ? Const.langType : this.loginInfo.lang;
    var header: IObjectString = this.getNotifyHeader(lang);

    let modalContext = {
      'type': 'info',
      'style': 'success',
      'title': header['info'],
      'content': message,
      'OkFunction': okFunction
    }
    appService.modal(modalContext);
  }

  notifySuccess(appService: AppService, message: string, okFunction: any) {
    var lang = Ultility.isEmpty(this.loginInfo.lang) ? Const.langType : this.loginInfo.lang;
    var header: IObjectString = this.getNotifyHeader(lang);

    let modalContext = {
      'style': 'success',
      'title': header['success'],
      'content': message,
      'OkFunction': okFunction
    }
    appService.modal(modalContext);
  }

  notifyWarning(appService: AppService, message: string, okFunction: any) {
    var lang = Ultility.isEmpty(this.loginInfo.lang) ? Const.langType : this.loginInfo.lang;
    var header: IObjectString = this.getNotifyHeader(lang);

    let modalContext = {
      'style': 'warning',
      'title': header['warning'],
      'content': message,
      'OkFunction': okFunction
    }
    appService.modal(modalContext);
  }

  chosenPopup(appService: AppService, message: string, okFunction: any, notOkFunction: any, cancelFunction: any) {
    var lang = Ultility.isEmpty(this.loginInfo.lang) ? Const.langType : this.loginInfo.lang;
    var header: IObjectString = this.getNotifyHeader(lang);

    let modalContext = {
      'style': 'warning',
      'title': header['warning'],
      'content': message,
      'OkFunction': okFunction,
      'notOkFunction': notOkFunction,
      'cancelFunction': cancelFunction
    }
    appService.modal(modalContext);
  }

  notifyChosen(appService: AppService, message: string, okFunction: any, notOkFunction: any, cancelFunction: any) {
    var lang = Ultility.isEmpty(this.loginInfo.lang) ? Const.langType : this.loginInfo.lang;
    var header: IObjectString = this.getNotifyHeader(lang);

    let modalContext = {
      'type': 'warning',
      'style': 'success',
      'title': header['confirm'],
      'content': message,
      'OkFunction': okFunction,
      'notOkFunction': notOkFunction,
      'cancelFunction': cancelFunction
    }
    appService.modal(modalContext);
  }

  notifyError(appService: AppService, message: string, okFunction: any) {
    var lang = Ultility.isEmpty(this.loginInfo.lang) ? Const.langType : this.loginInfo.lang;
    var header: IObjectString = this.getNotifyHeader(lang);

    let modalContext = {
      'type': 'error',
      'style': 'danger',
      'title': header['error'],
      'content': message,
      'OkFunction': okFunction
    }
    appService.modal(modalContext);
  }

  getNotifyHeader(lang: string) {
    switch (lang) {
      case Const.langVNM:
        return Const.HeaderNotify[Const.langVNM]
      case Const.langJPN:
        return Const.HeaderNotify[Const.langJPN]
      case Const.langENG:
        return Const.HeaderNotify[Const.langENG]
      default:
        return Const.HeaderNotify[Const.langJPN]
    }
  }
  linkToChildMenu() {
    var header = "";
    switch (this.loginInfo.lang) {
      case Const.langVNM:
        header = "Menu"
        break;
      case Const.langJPN:
        header = "メニュー"
        break;
      case Const.langENG:
        header = "Menu"
        break;
      default:
        header = "メニュー"
        break;
    }
    this.notifyConfirm(this.injector.get(AppService), this.messageEntity.message["MQ000003"].replace("%1", header), () => {
      this.backToMenu();
    }, undefined);
  }
}

