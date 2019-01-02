import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Toast } from '@ionic-native/toast';

/**
 * Generated class for the AddExpensePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-add-expense',
  templateUrl: 'add-expense.html',
})
export class AddExpensePage {
	
	expenseDate: String = new Date().toISOString();
  data = { expenseDate:"", type:"", description:"", amount:1.0 };
  
  constructor(
		public navCtrl: NavController,
    public navParams: NavParams,
    private sqlite: SQLite,
    private toast: Toast
  ) {}
  
  bttCancel() {
		this.navCtrl.popToRoot();
	}

  ionViewDidLoad() {
    console.log('ionViewDidLoad AddExpensePage');
  }
  
  saveData() {
    this.sqlite.create( //open or create
			{ 
				name: 'ionicdb.db',
				location: 'default'
			}
		).then((db: SQLiteObject) => {
      db.executeSql('INSERT INTO expense VALUES(NULL,?,?,?,?)',[this.data.expenseDate,"EXPENSE",this.data.description,this.data.amount])
        .then(res => {
          console.log("data inserted");
          console.log(this.data.expenseDate);
          this.toast.show('Data saved', '5000', 'center').subscribe(
            toast => {
              this.navCtrl.popToRoot();
            }
          );
        })
        .catch(e => {
          console.log(e);
          this.toast.show(e, '5000', 'center').subscribe(
            toast => {
              console.log(toast);
            }
          );
        });
    }).catch(e => {
      console.log(e);
      this.toast.show(e, '5000', 'center').subscribe(
        toast => {
          console.log(toast);
        }
      );
    });
  }

}
