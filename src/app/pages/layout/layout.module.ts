import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LayoutPageRoutingModule } from './layout-routing.module';

import { LayoutPage } from './layout.page';
import { SidebarComponent } from 'src/app/components/sidebar/sidebar.component';
import { WorkspaceComponent } from 'src/app/components/workspace/workspace.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LayoutPageRoutingModule
  ],
  declarations: [LayoutPage,SidebarComponent,WorkspaceComponent]
})
export class LayoutPageModule {}
