import { useQuery } from '@tanstack/react-query';
import { cartService } from '../../services/cart.service';
import { queryKeys } from '../../lib/react-query/queryKeys';
import { useAuth } from '../../contexts/AuthContext';

export const useCart = () => {
    const { isAuthenticated } = useAuth();
    
    return useQuery({
        queryKey: queryKeys.cart.current(),
        queryFn: () => cartService.getCart(),
        enabled: isAuthenticated,
        retry: 0,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
