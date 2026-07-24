import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Chat } from './chat/chat';
import { NotificationTray } from './notifications/notification-tray';
import { PeterFace } from './face/peter-face';
import { BackgroundFx } from './background/background-fx';
import { UiService } from './core/ui.service';
import { WsService } from './core/ws.service';

@Component({
  selector: 'app-root',
  imports: [Chat, NotificationTray, PeterFace, BackgroundFx],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  readonly ws = inject(WsService);
  readonly ui = inject(UiService);

  ngOnInit(): void {
    this.ws.connect();
  }
}
