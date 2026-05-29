export const queryKeys = {
    restaurants: {
        all: ['restaurants'],
        lists: () => [...queryKeys.restaurants.all, 'list'],
        list: (filters) => [...queryKeys.restaurants.lists(), filters],
        details: () => [...queryKeys.restaurants.all, 'detail'],
        detail: (id) => [...queryKeys.restaurants.details(), id],
    },
    cart: {
        all: ['cart'],
        current: () => [...queryKeys.cart.all, 'current'],
    },
    orders: {
        all: ['orders'],
        lists: () => [...queryKeys.orders.all, 'list'],
        list: (filters) => [...queryKeys.orders.lists(), filters],
        details: () => [...queryKeys.orders.all, 'detail'],
        detail: (id) => [...queryKeys.orders.details(), id],
    },
    user: {
        all: ['user'],
        addresses: () => [...queryKeys.user.all, 'addresses'],
    },
    owner: {
        all: ['owner'],
        restaurants: {
            all: ['owner', 'restaurants'],
            lists: () => [...queryKeys.owner.restaurants.all, 'list'],
            list: (filters) => [...queryKeys.owner.restaurants.lists(), filters],
            details: () => [...queryKeys.owner.restaurants.all, 'detail'],
            detail: (id) => [...queryKeys.owner.restaurants.details(), id],
        },
        menu: {
            all: ['owner', 'menu'],
            items: (restaurantId) => [...queryKeys.owner.menu.all, 'items', restaurantId],
            categories: (restaurantId) => [...queryKeys.owner.menu.all, 'categories', restaurantId],
        },
        orders: {
            all: ['owner', 'orders'],
            lists: () => [...queryKeys.owner.orders.all, 'list'],
            list: (filters) => [...queryKeys.owner.orders.lists(), filters],
            details: () => [...queryKeys.owner.orders.all, 'detail'],
            detail: (id) => [...queryKeys.owner.orders.details(), id],
        },
        reviews: {
            all: ['owner', 'reviews'],
            lists: () => [...queryKeys.owner.reviews.all, 'list'],
            list: (filters) => [...queryKeys.owner.reviews.lists(), filters],
        },
    },
    delivery: {
        all: ['delivery'],
        profile: () => [...queryKeys.delivery.all, 'profile'],
        orders: {
            all: ['delivery', 'orders'],
            lists: () => [...queryKeys.delivery.orders.all, 'list'],
            list: (filters) => [...queryKeys.delivery.orders.lists(), filters],
            details: () => [...queryKeys.delivery.orders.all, 'detail'],
            detail: (id) => [...queryKeys.delivery.orders.details(), id],
        }
    },
    admin: {
        all: ['admin'],
        restaurants: {
            all: ['admin', 'restaurants'],
            lists: () => [...queryKeys.admin.restaurants.all, 'list'],
            list: (filters) => [...queryKeys.admin.restaurants.lists(), filters],
            details: () => [...queryKeys.admin.restaurants.all, 'detail'],
            detail: (id) => [...queryKeys.admin.restaurants.details(), id],
        },
        orders: {
            all: ['admin', 'orders'],
            lists: () => [...queryKeys.admin.orders.all, 'list'],
            list: (filters) => [...queryKeys.admin.orders.lists(), filters],
            details: () => [...queryKeys.admin.orders.all, 'detail'],
            detail: (id) => [...queryKeys.admin.orders.details(), id],
        },
        payments: {
            all: ['admin', 'payments'],
            lists: () => [...queryKeys.admin.payments.all, 'list'],
            list: (filters) => [...queryKeys.admin.payments.lists(), filters],
        },
        deliveryPartners: {
            all: ['admin', 'deliveryPartners'],
            lists: () => [...queryKeys.admin.deliveryPartners.all, 'list'],
            list: (filters) => [...queryKeys.admin.deliveryPartners.lists(), filters],
        },
        reviews: {
            all: ['admin', 'reviews'],
            lists: () => [...queryKeys.admin.reviews.all, 'list'],
            list: (filters) => [...queryKeys.admin.reviews.lists(), filters],
        }
    }
};
