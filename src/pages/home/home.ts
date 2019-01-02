import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Toast } from '@ionic-native/toast';


import { AddExpensePage } from '../add-expense/add-expense';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
	monthNameIta = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
	expenses: any = [];
	totalIncome = 0;
	totalExpense = 0;
	balance = 0;
	currentDate;
	currentMonth = "N/A";
	
  constructor(public navCtrl: NavController, private sqlite: SQLite, private toast: Toast) {
		this.currentDate = new Date();
		this.currentMonth = this.monthNameIta[this.currentDate.getMonth()];
  }
  
  ionViewDidLoad() {
		this.getData();
	}

	ionViewWillEnter() {
		this.getData();
	}

	getData() {
		this.sqlite.create
		(
			{
				name: 'ionicdb.db',
				location: 'default'
			}
		).then((db: SQLiteObject) => {
		
			/* Create table if not exists */
			db.executeSql('CREATE TABLE IF NOT EXISTS expense(rowid INTEGER PRIMARY KEY, date TEXT, type TEXT, description TEXT, amount INT)', [])
			.then(res => console.log('Create table if not exists: Executed SQL'))
			.catch(e => console.log(e));
			
			/* Truncate table */
			/*db.executeSql('DELETE FROM expense',[])
			.then(res => console.log('truncata'))
			.catch(e => console.log(e));*/
			
			db.executeSql('SELECT * FROM expense ORDER BY rowid DESC LIMIT 5', [])
			.then(res => {
						
				this.expenses = [];
				for(var i=0; i<res.rows.length; i++) {
					this.expenses.push(
						{
							rowid:res.rows.item(i).rowid
							, date:res.rows.item(i).date
							, type:res.rows.item(i).type
							, description:res.rows.item(i).description
							, amount:res.rows.item(i).amount
						}
					)
				}
			})
			.catch(e => console.log(e));
			
			/* Get total income */
			db.executeSql('SELECT SUM(amount) AS totalIncome FROM expense WHERE type="INCOME"', []
				)
			.then(res => {
				if(res.rows.length > 0 && res.rows[0] != null) {
					this.totalIncome = parseInt(res.rows.item(0).totalIncome);
				}
				else{
					this.totalIncome = 0;
				}
				console.log("total income:" + this.totalIncome);
			})
			.catch(e => console.log(e));
			
			/* Get total expense */
			db.executeSql('SELECT SUM(amount) AS totalExpense FROM expense WHERE type="EXPENSE"', [])
			.then(res => {
				if(res.rows.length > 0 ) {
					this.totalExpense = parseInt(res.rows.item(0).totalExpense);
					this.balance = this.totalIncome-this.totalExpense;
					this.toast.show('Total Expense:' + this.totalExpense, '5000', 'center');
				}
			})
		}).catch(e => console.log(e));
	}

	addExpense() {
		this.navCtrl.push(AddExpensePage);
	}

	/*editData(rowid) {
		this.navCtrl.push(EditDataPage, {
			rowid:rowid
		});
	}*/

	deleteData(rowid) {
		this.sqlite.create({
			name: 'ionicdb.db',
			location: 'default'
		}).then((db: SQLiteObject) => {
			db.executeSql('DELETE FROM expense WHERE rowid=?', [rowid])
			.then(res => {
				console.log(res);
				this.getData();
			})
			.catch(e => console.log(e));
		}).catch(e => console.log(e));
	}
  
}
