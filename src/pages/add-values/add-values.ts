import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { AddExpensePage } from '../add-expense/add-expense';
import { AddIncomePage } from '../add-income/add-income';

/**
 * Generated class for the AddValuesPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-add-values',
  templateUrl: 'add-values.html',
})
export class AddValuesPage {

	tabAddExpense;
  tabAddIncome;
  
  constructor(public navCtrl: NavController, public navParams: NavParams) {
		this.tabAddExpense = AddExpensePage;
		this.tabAddIncome = AddIncomePage;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AddValuesPage');
  }

}
