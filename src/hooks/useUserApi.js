// hooks/useUserApi.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import UserAPI from '@/api/user.api'
import {ref} from "vue";
export function useCustomerList(queryParams = ref(), options = {}) {
  return useQuery({
    queryKey: ['customers', queryParams],
    queryFn: () => UserAPI.getCustomerList(queryParams.value).then(res => res.data),
    ...options
  })
}