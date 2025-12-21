import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { API_URLS } from "../../core/api.config";
import { OfferingRequest, OfferingResponse, OfferingCategory, PriceModifier } from "../../models/api-models/offering.models";

@Injectable({
    providedIn: 'root'
})
export class OfferingApiService {
    private readonly http = inject(HttpClient);

    createOffering(request: OfferingRequest): Observable<void> {
        return this.http.post<void>(API_URLS.offering, request);
    }

    getOfferings(category: OfferingCategory | null, price: number, modifier: PriceModifier): Observable<OfferingResponse[]> {
        let params = new HttpParams()
            .set('price', price.toString())
            .set('modifier', modifier);
        
        if (category) {
            params = params.set('category', category);
        }

        return this.http.get<OfferingResponse[]>(API_URLS.offering, { params });
    }

    cancelOffering(offeringId: string): Observable<void> {
        return this.http.patch<void>(`${API_URLS.offering}/${offeringId}/cancel`, {});
    }
}

