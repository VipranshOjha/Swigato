import { useQuery } from '@tanstack/react-query';
import { userService } from '../../services/user.service';
import { queryKeys } from '../../lib/react-query/queryKeys';

export const useAddresses = () => {
    return useQuery({
        queryKey: queryKeys.user.addresses(),
        queryFn: () => userService.getAddresses()
    });
};
