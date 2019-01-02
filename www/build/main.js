webpackJsonp([3],{

/***/ 102:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AddExpensePage; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ionic_native_sqlite__ = __webpack_require__(78);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__ionic_native_toast__ = __webpack_require__(80);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




/**
 * Generated class for the AddExpensePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */
var AddExpensePage = /** @class */ (function () {
    function AddExpensePage(navCtrl, navParams, sqlite, toast) {
        this.navCtrl = navCtrl;
        this.navParams = navParams;
        this.sqlite = sqlite;
        this.toast = toast;
        this.expenseDate = new Date().toISOString();
        this.data = { expenseDate: "", type: "", description: "", amount: 1.0 };
    }
    AddExpensePage.prototype.bttCancel = function () {
        this.navCtrl.popToRoot();
    };
    AddExpensePage.prototype.ionViewDidLoad = function () {
        console.log('ionViewDidLoad AddExpensePage');
    };
    AddExpensePage.prototype.saveData = function () {
        var _this = this;
        this.sqlite.create(//open or create
        {
            name: 'ionicdb.db',
            location: 'default'
        }).then(function (db) {
            db.executeSql('INSERT INTO expense VALUES(NULL,?,?,?,?)', [_this.data.expenseDate, "EXPENSE", _this.data.description, _this.data.amount])
                .then(function (res) {
                console.log("data inserted");
                console.log(_this.data.expenseDate);
                _this.toast.show('Data saved', '5000', 'center').subscribe(function (toast) {
                    _this.navCtrl.popToRoot();
                });
            })
                .catch(function (e) {
                console.log(e);
                _this.toast.show(e, '5000', 'center').subscribe(function (toast) {
                    console.log(toast);
                });
            });
        }).catch(function (e) {
            console.log(e);
            _this.toast.show(e, '5000', 'center').subscribe(function (toast) {
                console.log(toast);
            });
        });
    };
    AddExpensePage = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* Component */])({
            selector: 'page-add-expense',template:/*ion-inline-start:"/home/miky/controlloSpese/src/pages/add-expense/add-expense.html"*/'<!--\n  Generated template for the AddExpensePage page.\n\n  See http://ionicframework.com/docs/components/#navigation for more info on\n  Ionic pages and navigation.\n-->\n<ion-header>\n\n  <ion-navbar>\n    <ion-title>AddExpense</ion-title>\n  </ion-navbar>\n\n</ion-header>\n\n\n<ion-content padding>\n	\n	<p>\n	  <ion-item>\n			<ion-label color="primary" fixed>Spesa</ion-label>\n			<ion-input type="number" placeholder="0.0" min="0.0" [(ngModel)]="data.amount" name="amount"></ion-input>\n	  </ion-item>\n	</p>\n	<p> \n		<ion-item>\n			<ion-label color="primary">Categoria</ion-label>\n			<ion-input type="text" placeholder="Altro" ></ion-input>\n	  </ion-item>\n	  	  \n  </p>\n\n  <p>\n		<ion-item>\n			<ion-label color="primary" fixed>Data</ion-label>\n			<ion-datetime displayFormat="DD/MM/YYYY" [(ngModel)]="data.expenseDate" name="expenseDate"></ion-datetime>\n		</ion-item>\n\n  </p>\n\n  \n  <p>\n		<ion-item>\n			<ion-label color="primary" fixed>Description</ion-label>\n			<ion-input type="text" placeholder="Descrizione" [(ngModel)]="data.description" name="description"></ion-input>\n		</ion-item>\n\n  </p>\n  \n  <p>\n			<button ion-button round color="danger" (click)="bttCancel()">Annulla</button>\n			<button ion-button round color="green" (click)="saveData()">Conferma</button>\n  </p>\n</ion-content>\n'/*ion-inline-end:"/home/miky/controlloSpese/src/pages/add-expense/add-expense.html"*/,
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["g" /* NavController */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["h" /* NavParams */],
            __WEBPACK_IMPORTED_MODULE_2__ionic_native_sqlite__["a" /* SQLite */],
            __WEBPACK_IMPORTED_MODULE_3__ionic_native_toast__["a" /* Toast */]])
    ], AddExpensePage);
    return AddExpensePage;
}());

//# sourceMappingURL=add-expense.js.map

/***/ }),

/***/ 112:
/***/ (function(module, exports) {

function webpackEmptyAsyncContext(req) {
	// Here Promise.resolve().then() is used instead of new Promise() to prevent
	// uncatched exception popping up in devtools
	return Promise.resolve().then(function() {
		throw new Error("Cannot find module '" + req + "'.");
	});
}
webpackEmptyAsyncContext.keys = function() { return []; };
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
module.exports = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = 112;

/***/ }),

/***/ 153:
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"../pages/add-expense/add-expense.module": [
		273,
		2
	],
	"../pages/add-income/add-income.module": [
		274,
		1
	],
	"../pages/add-values/add-values.module": [
		275,
		0
	]
};
function webpackAsyncContext(req) {
	var ids = map[req];
	if(!ids)
		return Promise.reject(new Error("Cannot find module '" + req + "'."));
	return __webpack_require__.e(ids[1]).then(function() {
		return __webpack_require__(ids[0]);
	});
};
webpackAsyncContext.keys = function webpackAsyncContextKeys() {
	return Object.keys(map);
};
webpackAsyncContext.id = 153;
module.exports = webpackAsyncContext;

/***/ }),

/***/ 194:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return HomePage; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ionic_native_sqlite__ = __webpack_require__(78);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__ionic_native_toast__ = __webpack_require__(80);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__add_expense_add_expense__ = __webpack_require__(102);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};





var HomePage = /** @class */ (function () {
    function HomePage(navCtrl, sqlite, toast) {
        this.navCtrl = navCtrl;
        this.sqlite = sqlite;
        this.toast = toast;
        this.expenses = [];
        this.totalIncome = 0;
        this.totalExpense = 0;
        this.balance = 0;
        this.monthNameIta = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
        this.currentDate = new Date();
        this.currentMonth = this.monthNameIta[this.currentDate.getMonth()];
    }
    HomePage.prototype.setBalanceColor = function () {
        this.textColor = this.balance > 0 ? "balance-color-red-green" : "balance-color-red";
    };
    HomePage.prototype.ionViewDidLoad = function () {
        console.log("view loaded!");
        this.getData();
        this.setBalanceColor(); //set balance class
    };
    HomePage.prototype.ionViewWillEnter = function () {
        this.getData();
    };
    HomePage.prototype.getData = function () {
        var _this = this;
        this.sqlite.create({
            name: 'ionicdb.db',
            location: 'default'
        }).then(function (db) {
            /* Create table if not exists */
            db.executeSql('CREATE TABLE IF NOT EXISTS expense(rowid INTEGER PRIMARY KEY, date TEXT, type TEXT, description TEXT, amount INT)', [])
                .then(function (res) { return console.log('Create table if not exists: Executed SQL'); })
                .catch(function (e) { return console.log(e); });
            /* Truncate table */
            /*db.executeSql('DELETE FROM expense',[])
            .then(res => console.log('truncata'))
            .catch(e => console.log(e));*/
            db.executeSql('SELECT * FROM expense ORDER BY rowid DESC LIMIT 5', [])
                .then(function (res) {
                _this.expenses = [];
                for (var i = 0; i < res.rows.length; i++) {
                    _this.expenses.push({
                        rowid: res.rows.item(i).rowid,
                        date: res.rows.item(i).date,
                        type: res.rows.item(i).type,
                        description: res.rows.item(i).description,
                        amount: res.rows.item(i).amount
                    });
                }
            })
                .catch(function (e) { return console.log(e); });
            /* Get total income */
            db.executeSql('SELECT SUM(amount) AS totalIncome FROM expense WHERE type="INCOME"', [])
                .then(function (res) {
                if (res.rows.length > 0 && res.rows[0] != null) {
                    _this.totalIncome = parseInt(res.rows.item(0).totalIncome);
                }
                else {
                    _this.totalIncome = 0;
                }
                console.log("total income:" + _this.totalIncome);
            })
                .catch(function (e) { return console.log(e); });
            /* Get total expense */
            db.executeSql('SELECT SUM(amount) AS totalExpense FROM expense WHERE type="EXPENSE"', [])
                .then(function (res) {
                if (res.rows.length > 0) {
                    _this.totalExpense = parseInt(res.rows.item(0).totalExpense);
                    _this.balance = _this.totalIncome - _this.totalExpense;
                    _this.toast.show('Total Expense:' + _this.totalExpense, '5000', 'center');
                }
            });
        }).catch(function (e) { return console.log(e); });
    };
    HomePage.prototype.addExpense = function () {
        this.navCtrl.push(__WEBPACK_IMPORTED_MODULE_4__add_expense_add_expense__["a" /* AddExpensePage */]);
    };
    /*editData(rowid) {
        this.navCtrl.push(EditDataPage, {
            rowid:rowid
        });
    }*/
    HomePage.prototype.deleteData = function (rowid) {
        var _this = this;
        this.sqlite.create({
            name: 'ionicdb.db',
            location: 'default'
        }).then(function (db) {
            db.executeSql('DELETE FROM expense WHERE rowid=?', [rowid])
                .then(function (res) {
                console.log(res);
                _this.getData();
            })
                .catch(function (e) { return console.log(e); });
        }).catch(function (e) { return console.log(e); });
    };
    HomePage = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* Component */])({
            selector: 'page-home',template:/*ion-inline-start:"/home/miky/controlloSpese/src/pages/home/home.html"*/'<ion-header>\n  <ion-navbar>\n    <button ion-button menuToggle>\n      <ion-icon name="menu"></ion-icon>\n    </button>\n    <ion-title>Home Page</ion-title>\n  </ion-navbar>\n</ion-header>\n\n\n<ion-content fullscreen>\n	<ion-card>\n\n  <ion-card-header class="card-header">\n   BILANCIO MENSILE\n   <p><span>{{currentMonth}}, {{currentDate | date:"yyyy"}}</span></p>\n  </ion-card-header>\n  \n  <ion-card-content>\n\n		<button ion-button full color="danger">\n			Spesa (€): {{totalExpense}}\n		</button>\n		\n		<button ion-button full color="green">\n			<span>Incasso (€): {{totalIncome}}</span>\n		</button>\n	 </ion-card-content>\n	 \n	 <ion-row class="card-footer" ngClass="{{textColor}}" >\n      <ion-col >\n				<div>SALDO (€): {{balance}}</div>\n      </ion-col>\n    </ion-row>\n\n\n\n</ion-card>\n	 <!--<ion-grid>\n		<ion-row>\n			<ion-col>\n					<div>\n						<span>Incasso: {{totalIncome}}</span><br />\n						<span>Spesa: {{totalExpense}}</span><br />\n						<span>Saldo: {{balance}}</span>\n					</div>\n			</ion-col>\n		</ion-row>\n		<ion-row>\n			<ion-col>\n				<ion-item-sliding *ngFor="let expense of expenses; let i=index">-\n					<ion-item nopadding>\n						<p>\n						<span>\n								{{expense.date}}</span><br>\n								Type: {{expense.type}}<br>\n								{{expense.description}}\n						</p>\n						<h3 item-end>\n							Amount: €{{expense.amount}}\n						</h3>\n					</ion-item> \n					</ion-item-sliding>\n					\n			</ion-col>\n		</ion-row>\n		</ion-grid>\n		-->\n  \n    <!--  <ion-item-options side="right">\n        <button ion-button color="primary" >\n        </button>\n        <button ion-button color="danger">\n        </button>\n      </ion-item-options>\n    </ion-item-sliding>\n		-->\n	<ion-fab bottom right>\n			<div>\n				<button ion-fab color="danger" (click)="addExpense()"><ion-icon name="remove"></ion-icon></button>\n			</div>\n			<div class="btt-add-income">\n				<button ion-fab color="green" menuToggle><ion-icon name="add"></ion-icon></button>\n			</div>\n	</ion-fab>\n<!-- 	<p>\n			<button ion-button round color="green" menuToggle>Aggiungi Entrata</button>\n			<button ion-button round color="danger" (click)="addExpense()">Aggiungi Spesa</button>\n		</p>\n-->\n</ion-content>\n'/*ion-inline-end:"/home/miky/controlloSpese/src/pages/home/home.html"*/
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["g" /* NavController */], __WEBPACK_IMPORTED_MODULE_2__ionic_native_sqlite__["a" /* SQLite */], __WEBPACK_IMPORTED_MODULE_3__ionic_native_toast__["a" /* Toast */]])
    ], HomePage);
    return HomePage;
}());

//# sourceMappingURL=home.js.map

/***/ }),

/***/ 197:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ItemDetailsPage; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(27);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var ItemDetailsPage = /** @class */ (function () {
    function ItemDetailsPage(navCtrl, navParams) {
        this.navCtrl = navCtrl;
        this.navParams = navParams;
        // If we navigated to this page, we will have an item available as a nav param
        this.selectedItem = navParams.get('item');
    }
    ItemDetailsPage = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* Component */])({
            selector: 'page-item-details',template:/*ion-inline-start:"/home/miky/controlloSpese/src/pages/item-details/item-details.html"*/'<ion-header>\n  <ion-navbar>\n    <button menuToggle *ngIf="!selectedItem">\n      <ion-icon name="menu"></ion-icon>\n    </button>\n    <ion-title>Item Details</ion-title>\n  </ion-navbar>\n</ion-header>\n\n<ion-content>\n  <h3 text-center *ngIf="selectedItem">\n    {{selectedItem.title}}\n    <ion-icon [name]="selectedItem.icon"></ion-icon>\n  </h3>\n  <h4 text-center *ngIf="selectedItem">\n    You navigated here from <b>{{selectedItem.title}}</b>\n  </h4>\n</ion-content>\n'/*ion-inline-end:"/home/miky/controlloSpese/src/pages/item-details/item-details.html"*/
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["g" /* NavController */], __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["h" /* NavParams */]])
    ], ItemDetailsPage);
    return ItemDetailsPage;
}());

//# sourceMappingURL=item-details.js.map

/***/ }),

/***/ 198:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser_dynamic__ = __webpack_require__(199);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__app_module__ = __webpack_require__(221);


Object(__WEBPACK_IMPORTED_MODULE_0__angular_platform_browser_dynamic__["a" /* platformBrowserDynamic */])().bootstrapModule(__WEBPACK_IMPORTED_MODULE_1__app_module__["a" /* AppModule */]);
//# sourceMappingURL=main.js.map

/***/ }),

/***/ 221:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser__ = __webpack_require__(31);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_ionic_angular__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__ionic_native_sqlite__ = __webpack_require__(78);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__ionic_native_toast__ = __webpack_require__(80);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__app_component__ = __webpack_require__(271);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__pages_home_home__ = __webpack_require__(194);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__pages_add_expense_add_expense__ = __webpack_require__(102);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__pages_item_details_item_details__ = __webpack_require__(197);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__pages_list_list__ = __webpack_require__(272);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__ionic_native_status_bar__ = __webpack_require__(195);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__ionic_native_splash_screen__ = __webpack_require__(196);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};












var AppModule = /** @class */ (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_1__angular_core__["I" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_5__app_component__["a" /* MyApp */],
                __WEBPACK_IMPORTED_MODULE_6__pages_home_home__["a" /* HomePage */],
                __WEBPACK_IMPORTED_MODULE_7__pages_add_expense_add_expense__["a" /* AddExpensePage */],
                __WEBPACK_IMPORTED_MODULE_8__pages_item_details_item_details__["a" /* ItemDetailsPage */],
                __WEBPACK_IMPORTED_MODULE_9__pages_list_list__["a" /* ListPage */]
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser__["a" /* BrowserModule */],
                __WEBPACK_IMPORTED_MODULE_2_ionic_angular__["c" /* IonicModule */].forRoot(__WEBPACK_IMPORTED_MODULE_5__app_component__["a" /* MyApp */], {}, {
                    links: [
                        { loadChildren: '../pages/add-expense/add-expense.module#AddExpensePageModule', name: 'AddExpensePage', segment: 'add-expense', priority: 'low', defaultHistory: [] },
                        { loadChildren: '../pages/add-income/add-income.module#AddIncomePageModule', name: 'AddIncomePage', segment: 'add-income', priority: 'low', defaultHistory: [] },
                        { loadChildren: '../pages/add-values/add-values.module#AddValuesPageModule', name: 'AddValuesPage', segment: 'add-values', priority: 'low', defaultHistory: [] }
                    ]
                }),
            ],
            bootstrap: [__WEBPACK_IMPORTED_MODULE_2_ionic_angular__["a" /* IonicApp */]],
            entryComponents: [
                __WEBPACK_IMPORTED_MODULE_5__app_component__["a" /* MyApp */],
                __WEBPACK_IMPORTED_MODULE_6__pages_home_home__["a" /* HomePage */],
                __WEBPACK_IMPORTED_MODULE_7__pages_add_expense_add_expense__["a" /* AddExpensePage */],
                __WEBPACK_IMPORTED_MODULE_8__pages_item_details_item_details__["a" /* ItemDetailsPage */],
                __WEBPACK_IMPORTED_MODULE_9__pages_list_list__["a" /* ListPage */]
            ],
            providers: [
                __WEBPACK_IMPORTED_MODULE_10__ionic_native_status_bar__["a" /* StatusBar */],
                __WEBPACK_IMPORTED_MODULE_11__ionic_native_splash_screen__["a" /* SplashScreen */],
                { provide: __WEBPACK_IMPORTED_MODULE_1__angular_core__["u" /* ErrorHandler */], useClass: __WEBPACK_IMPORTED_MODULE_2_ionic_angular__["b" /* IonicErrorHandler */] },
                __WEBPACK_IMPORTED_MODULE_3__ionic_native_sqlite__["a" /* SQLite */],
                __WEBPACK_IMPORTED_MODULE_4__ionic_native_toast__["a" /* Toast */]
            ]
        })
    ], AppModule);
    return AppModule;
}());

//# sourceMappingURL=app.module.js.map

/***/ }),

/***/ 271:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return MyApp; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__pages_home_home__ = __webpack_require__(194);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__ionic_native_status_bar__ = __webpack_require__(195);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__ionic_native_splash_screen__ = __webpack_require__(196);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


//pages



var MyApp = /** @class */ (function () {
    function MyApp(platform, menu, statusBar, splashScreen) {
        this.platform = platform;
        this.menu = menu;
        this.statusBar = statusBar;
        this.splashScreen = splashScreen;
        // make HelloIonicPage the root (or first) page
        this.rootPage = __WEBPACK_IMPORTED_MODULE_2__pages_home_home__["a" /* HomePage */];
        this.initializeApp();
        // set our app's pages
        /*this.pages = [
          { title: 'Hello Ionic', component: HelloIonicPage },
          { title: 'My First List', component: ListPage }
        ];*/
    }
    MyApp.prototype.initializeApp = function () {
        var _this = this;
        this.platform.ready().then(function () {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            _this.statusBar.styleDefault();
            _this.splashScreen.hide();
        });
    };
    MyApp.prototype.openPage = function (page) {
        // close the menu when clicking a link from the menu
        this.menu.close();
        // navigate to the new page if it is not the current page
        this.nav.setRoot(page.component);
    };
    __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_8" /* ViewChild */])(__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["f" /* Nav */]),
        __metadata("design:type", __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["f" /* Nav */])
    ], MyApp.prototype, "nav", void 0);
    MyApp = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* Component */])({template:/*ion-inline-start:"/home/miky/controlloSpese/src/app/app.html"*/'<ion-menu [content]="content">\n\n  <ion-header>\n    <ion-toolbar>\n      <ion-title>Pages</ion-title>\n    </ion-toolbar>\n  </ion-header>\n\n  <ion-content>\n    <ion-list>\n      <button ion-item *ngFor="let p of pages" (click)="openPage(p)">\n        {{p.title}}\n      </button>\n    </ion-list>\n  </ion-content>\n\n</ion-menu>\n\n<ion-nav [root]="rootPage" #content swipeBackEnabled="false"></ion-nav>\n'/*ion-inline-end:"/home/miky/controlloSpese/src/app/app.html"*/
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["i" /* Platform */],
            __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["e" /* MenuController */],
            __WEBPACK_IMPORTED_MODULE_3__ionic_native_status_bar__["a" /* StatusBar */],
            __WEBPACK_IMPORTED_MODULE_4__ionic_native_splash_screen__["a" /* SplashScreen */]])
    ], MyApp);
    return MyApp;
}());

//# sourceMappingURL=app.component.js.map

/***/ }),

/***/ 272:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ListPage; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__item_details_item_details__ = __webpack_require__(197);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var ListPage = /** @class */ (function () {
    function ListPage(navCtrl, navParams) {
        this.navCtrl = navCtrl;
        this.navParams = navParams;
        this.icons = ['flask', 'wifi', 'beer', 'football', 'basketball', 'paper-plane',
            'american-football', 'boat', 'bluetooth', 'build'];
        this.items = [];
        for (var i = 1; i < 11; i++) {
            this.items.push({
                title: 'Item ' + i,
                note: 'This is item #' + i,
                icon: this.icons[Math.floor(Math.random() * this.icons.length)]
            });
        }
    }
    ListPage.prototype.itemTapped = function (event, item) {
        this.navCtrl.push(__WEBPACK_IMPORTED_MODULE_2__item_details_item_details__["a" /* ItemDetailsPage */], {
            item: item
        });
    };
    ListPage = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* Component */])({
            selector: 'page-list',template:/*ion-inline-start:"/home/miky/controlloSpese/src/pages/list/list.html"*/'<ion-header>\n  <ion-navbar>\n    <button ion-button menuToggle>\n      <ion-icon name="menu"></ion-icon>\n    </button>\n    <ion-title>My First List</ion-title>\n  </ion-navbar>\n</ion-header>\n\n<ion-content>\n  <ion-list>\n    <button ion-item *ngFor="let item of items" (click)="itemTapped($event, item)">\n      <ion-icon name="{{item.icon}}" item-left></ion-icon>\n      {{item.title}}\n      <div class="item-note" item-right>\n        {{item.note}}\n      </div>\n    </button>\n  </ion-list>\n</ion-content>\n'/*ion-inline-end:"/home/miky/controlloSpese/src/pages/list/list.html"*/
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["g" /* NavController */], __WEBPACK_IMPORTED_MODULE_1_ionic_angular__["h" /* NavParams */]])
    ], ListPage);
    return ListPage;
}());

//# sourceMappingURL=list.js.map

/***/ })

},[198]);
//# sourceMappingURL=main.js.map