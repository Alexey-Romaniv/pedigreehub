export { axiosInstance as api } from './axiosInstance'
export { breedsApi, useBreeds, type Breed, type BreedsResponse } from './breeds'
export { getApiErrorMessage, type ApiError } from './apiError'
export {
  favoritesApi,
  useFavoriteIds,
  useFavoritesList,
  useToggleFavorite,
  type FavoriteEntry,
  type FavoritesPagination,
} from './favorites'
