import { Component, OnInit } from '@angular/core';
import { RedirectionService } from 'src/app/services/redirection.service';

@Component({
  standalone: true,
  selector: 'app-dummy-redirect',
  template: '',
})
export class DummyRedirectComponent implements OnInit {
  constructor(private redirectionService: RedirectionService) {}

  ngOnInit() {
    this.redirectionService.redirectUserByRole();
  }
}
