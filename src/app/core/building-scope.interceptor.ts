import {
  HttpInterceptorFn,
} from '@angular/common/http';

import { inject } from '@angular/core';

import { BuildingContextService } from './building-context.service';


const BUILDING_SCOPED_ENDPOINTS = [
  '/post',
  '/post/announcement',
  '/post/event',
  '/interaction',
  '/facility',
];


export const buildingScopeInterceptor: HttpInterceptorFn = (
  req,
  next,
) => {

  const buildingContext =
    inject(BuildingContextService);


  const isBuildingScoped =
    BUILDING_SCOPED_ENDPOINTS.some(
      endpoint =>
        matchesEndpoint(req.url, endpoint),
    );


  if (!isBuildingScoped) {
    return next(req);
  }


  const buildingId =
    buildingContext.getBuildingId();


  if (!buildingId) {
    return next(req);
  }

  if (req.params.has('buildingId')) {
    return next(req);
  }


  const scopedRequest = req.clone({
    params: req.params.set(
      'buildingId',
      buildingId,
    ),
  });


  return next(scopedRequest);
};


function matchesEndpoint(
  url: string,
  endpoint: string,
): boolean {

  const cleanUrl =
    url.split('?')[0];


  return cleanUrl.endsWith(endpoint);
}
