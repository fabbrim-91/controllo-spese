import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AddValuesPage } from './add-values';

@NgModule({
  declarations: [
    AddValuesPage,
  ],
  imports: [
    IonicPageModule.forChild(AddValuesPage),
  ],
})
export class AddValuesPageModule {}
