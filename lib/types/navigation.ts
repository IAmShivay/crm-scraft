import { ROUTE_CONFIG } from '../constant/route';

export type RouteKey = typeof ROUTE_CONFIG[number]['key'];
export type Route = typeof ROUTE_CONFIG[number];