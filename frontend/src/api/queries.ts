import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  DeparturesResponse,
  EventsResponse,
  FacilityLocation,
  GraphColumn,
  GraphList,
  GraphSettingsPublic,
  GraphSite,
  MediaItem,
  NearbyStop,
  SlideshowResponse,
  Stop,
  TestConnectionResult,
} from '../../../shared/types';
import { api } from './client';

const DEFAULT_DEPARTURES_POLL_SECONDS = 60;
const DEFAULT_EVENTS_POLL_SECONDS = 300;

export function useDepartures() {
  return useQuery({
    queryKey: ['display', 'departures'],
    queryFn: () => api.get<DeparturesResponse>('/display/departures'),
    refetchInterval: (query) =>
      (query.state.data?.refreshIntervalSeconds ?? DEFAULT_DEPARTURES_POLL_SECONDS) * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useEvents() {
  return useQuery({
    queryKey: ['display', 'events'],
    queryFn: () => api.get<EventsResponse>('/display/events'),
    refetchInterval: (query) =>
      (query.state.data?.refreshIntervalSeconds ?? DEFAULT_EVENTS_POLL_SECONDS) * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useAdminSession() {
  return useQuery({
    queryKey: ['admin', 'session'],
    queryFn: () => api.get<{ authenticated: boolean }>('/admin/session'),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => api.post<{ ok: boolean }>('/admin/login', { password }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'session'] }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ ok: boolean }>('/admin/logout'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'session'] }),
  });
}

export function useGeocode() {
  return useMutation({
    mutationFn: (address: string) =>
      api.post<{ lat: number; lon: number; displayName: string }>('/admin/geocode', { address }),
  });
}

export function useFacilityLocation() {
  return useQuery({
    queryKey: ['admin', 'facility'],
    queryFn: () => api.get<FacilityLocation>('/admin/location'),
  });
}

export function useSaveLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (location: { lat: number; lon: number; address: string }) =>
      api.put<FacilityLocation>('/admin/location', location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'facility'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'nearby-stops'] });
    },
  });
}

export function useNearbyStops(enabled: boolean, radiusMeters: number) {
  return useQuery({
    queryKey: ['admin', 'nearby-stops', radiusMeters],
    queryFn: () => api.get<NearbyStop[]>(`/admin/stops/nearby?radius=${radiusMeters}`),
    enabled,
  });
}

export function useSelectedStops() {
  return useQuery({
    queryKey: ['admin', 'selected-stops'],
    queryFn: () => api.get<Stop[]>('/admin/stops/selected'),
  });
}

export function useSaveSelectedStops() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stops: Stop[]) => api.put<Stop[]>('/admin/stops/selected', { stops }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'selected-stops'] }),
  });
}

export function useDeparturesInterval() {
  return useQuery({
    queryKey: ['admin', 'departures-interval'],
    queryFn: () =>
      api.get<{ refreshIntervalSeconds: number }>('/admin/settings/departures-interval'),
  });
}

export function useSaveDeparturesInterval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (seconds: number) =>
      api.put<{ refreshIntervalSeconds: number }>('/admin/settings/departures-interval', {
        seconds,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'departures-interval'] }),
  });
}

export function useDeparturesLookahead() {
  return useQuery({
    queryKey: ['admin', 'departures-lookahead'],
    queryFn: () => api.get<{ lookaheadMinutes: number }>('/admin/settings/departures-lookahead'),
  });
}

export function useSaveDeparturesLookahead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (minutes: number) =>
      api.put<{ lookaheadMinutes: number }>('/admin/settings/departures-lookahead', { minutes }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'departures-lookahead'] }),
  });
}

export function useGraphSettings() {
  return useQuery({
    queryKey: ['admin', 'graph-settings'],
    queryFn: () => api.get<GraphSettingsPublic>('/admin/graph/settings'),
  });
}

export function useSaveGraphSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: { tenantId: string; clientId: string; clientSecret?: string }) =>
      api.put<GraphSettingsPublic>('/admin/graph/settings', settings),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'graph-settings'] }),
  });
}

export function useGraphSites(search: string, enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'graph-sites', search],
    queryFn: () => api.get<GraphSite[]>(`/admin/graph/sites?search=${encodeURIComponent(search)}`),
    enabled,
  });
}

export function useGraphLists(siteId: string | null) {
  return useQuery({
    queryKey: ['admin', 'graph-lists', siteId],
    queryFn: () => api.get<GraphList[]>(`/admin/graph/sites/${siteId}/lists`),
    enabled: Boolean(siteId),
  });
}

export function useGraphColumns(siteId: string | null, listId: string | null) {
  return useQuery({
    queryKey: ['admin', 'graph-columns', siteId, listId],
    queryFn: () => api.get<GraphColumn[]>(`/admin/graph/lists/${siteId}/${listId}/columns`),
    enabled: Boolean(siteId && listId),
  });
}

export function useSaveGraphMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mapping: {
      siteId: string;
      siteName: string;
      listId: string;
      listName: string;
      title: string;
      start: string;
      end: string;
      location: string;
      description: string;
      showDetails: string;
    }) => api.put('/admin/graph/mapping', mapping),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'graph-settings'] }),
  });
}

export function useTestGraphConnection() {
  return useMutation({
    mutationFn: () => api.post<TestConnectionResult>('/admin/graph/test-connection'),
  });
}

export function useEventsInterval() {
  return useQuery({
    queryKey: ['admin', 'events-interval'],
    queryFn: () => api.get<{ refreshIntervalSeconds: number }>('/admin/settings/events-interval'),
  });
}

export function useSaveEventsInterval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (seconds: number) =>
      api.put<{ refreshIntervalSeconds: number }>('/admin/settings/events-interval', { seconds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'events-interval'] }),
  });
}

export function useEventsOverviewDuration() {
  return useQuery({
    queryKey: ['admin', 'events-overview-duration'],
    queryFn: () =>
      api.get<{ overviewDurationSeconds: number }>('/admin/settings/events-overview-duration'),
  });
}

export function useSaveEventsOverviewDuration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (seconds: number) =>
      api.put<{ overviewDurationSeconds: number }>('/admin/settings/events-overview-duration', {
        seconds,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'events-overview-duration'] }),
  });
}

export function useEventsDetailDuration() {
  return useQuery({
    queryKey: ['admin', 'events-detail-duration'],
    queryFn: () =>
      api.get<{ detailDurationSeconds: number }>('/admin/settings/events-detail-duration'),
  });
}

export function useSaveEventsDetailDuration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (seconds: number) =>
      api.put<{ detailDurationSeconds: number }>('/admin/settings/events-detail-duration', {
        seconds,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'events-detail-duration'] }),
  });
}

export function useMediaItems() {
  return useQuery({
    queryKey: ['admin', 'media'],
    queryFn: () => api.get<MediaItem[]>('/admin/media'),
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.postForm<MediaItem>('/admin/media', form);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'media'] }),
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<MediaItem[]>(`/admin/media/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'media'] }),
  });
}

export function useReorderMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: string[]) => api.put<MediaItem[]>('/admin/media/order', { order }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'media'] }),
  });
}

export function useSlideshowOverviewDuration() {
  return useQuery({
    queryKey: ['admin', 'slideshow-overview-duration'],
    queryFn: () =>
      api.get<{ overviewDurationSeconds: number }>('/admin/settings/slideshow-overview-duration'),
  });
}

export function useSaveSlideshowOverviewDuration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (seconds: number) =>
      api.put<{ overviewDurationSeconds: number }>(
        '/admin/settings/slideshow-overview-duration',
        { seconds }
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'slideshow-overview-duration'] }),
  });
}

export function useSlideshowItemDuration() {
  return useQuery({
    queryKey: ['admin', 'slideshow-item-duration'],
    queryFn: () =>
      api.get<{ itemDurationSeconds: number }>('/admin/settings/slideshow-item-duration'),
  });
}

export function useSaveSlideshowItemDuration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (seconds: number) =>
      api.put<{ itemDurationSeconds: number }>('/admin/settings/slideshow-item-duration', {
        seconds,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'slideshow-item-duration'] }),
  });
}

export function useSlideshow() {
  return useQuery({
    queryKey: ['display', 'slideshow'],
    queryFn: () => api.get<SlideshowResponse>('/display/slideshow'),
    refetchInterval: 5 * 60 * 1000,
  });
}
