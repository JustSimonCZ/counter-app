import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  AlertController,
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { CounterService } from '../services/counter.service';

type SortOrder = 'newest' | 'name' | 'value';
type ValueFilter = 'all' | 'positive' | 'negative';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [
    DatePipe,
    IonButton,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class Tab2Page implements OnInit {
  readonly counterService = inject(CounterService);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  readonly searchText = signal('');
  readonly sortOrder = signal<SortOrder>('newest');
  readonly valueFilter = signal<ValueFilter>('all');

  // Součet hodnot všech uložených počítadel se přepočítá při každé změně historie.
  readonly total = computed(() =>
    this.counterService.counters().reduce((sum, counter) => sum + counter.value, 0),
  );

  // Záznamy k zobrazení: nejdřív filtr hodnot a hledání podle názvu, potom řazení.
  readonly visibleCounters = computed(() => {
    const search = this.searchText().trim().toLowerCase();
    const valueFilter = this.valueFilter();

    const filtered = this.counterService.counters().filter((counter) => {
      const matchesSearch = counter.name.toLowerCase().includes(search);
      const matchesValue =
        valueFilter === 'all' ||
        (valueFilter === 'positive' && counter.value > 0) ||
        (valueFilter === 'negative' && counter.value < 0);

      return matchesSearch && matchesValue;
    });

    // filter() vytvořil nové pole, takže sort() nezmění pořadí uložené ve službě.
    switch (this.sortOrder()) {
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name, 'cs'));
      case 'value':
        return filtered.sort((a, b) => b.value - a.value);
      default:
        // Služba ukládá nejnovější záznam na začátek pole.
        return filtered;
    }
  });

  async ngOnInit(): Promise<void> {
    await this.counterService.initialize();
  }

  async remove(id: string): Promise<void> {
    await this.counterService.remove(id);

    // Toast zobrazíme až po úspěšném odstranění.
    const toast = await this.toastController.create({
      message: 'Záznam byl odstraněn.',
      duration: 2000,
      position: 'top',
    });
    await toast.present();
  }

  async clear(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Vymazat celou historii?',
      message: 'Všechny uložené záznamy budou odstraněny.',
      buttons: [
        { text: 'Zrušit', role: 'cancel' },
        { text: 'Vymazat', role: 'destructive' },
      ],
    });
    await alert.present();

    // Počkáme, až uživatel dialog zavře. Historii mažeme jen po potvrzení.
    const { role } = await alert.onDidDismiss();
    if (role === 'destructive') {
      await this.counterService.clear();
    }
  }
}
