export const mutationKeys = {
    cart: {
        update: () => ['cart', 'update'],
        clear: () => ['cart', 'clear'],
    },
    orders: {
        place: () => ['orders', 'place'],
        updateStatus: (id) => ['orders', 'updateStatus', id],
    },
    reviews: {
        submit: () => ['reviews', 'submit'],
    },
    auth: {
        login: () => ['auth', 'login'],
        register: () => ['auth', 'register'],
        logout: () => ['auth', 'logout'],
    },
    owner: {
        updateRestaurant: () => ['owner', 'updateRestaurant'],
        createRestaurant: () => ['owner', 'createRestaurant'],
        createMenuItem: () => ['owner', 'createMenuItem'],
        updateMenuItem: () => ['owner', 'updateMenuItem'],
        deleteMenuItem: () => ['owner', 'deleteMenuItem'],
        toggleAvailability: () => ['owner', 'toggleAvailability'],
        acceptOrder: () => ['owner', 'acceptOrder'],
        rejectOrder: () => ['owner', 'rejectOrder'],
        updateOrderStatus: () => ['owner', 'updateOrderStatus'],
        replyToReview: () => ['owner', 'replyToReview'],
    },
    delivery: {
        toggleOnline: () => ['delivery', 'toggleOnline'],
        acceptOrder: () => ['delivery', 'acceptOrder'],
        rejectOrder: () => ['delivery', 'rejectOrder'],
        markPickedUp: () => ['delivery', 'markPickedUp'],
        markInTransit: () => ['delivery', 'markInTransit'],
        markDelivered: () => ['delivery', 'markDelivered'],
    },
    admin: {
        approveRestaurant: () => ['admin', 'approveRestaurant'],
        rejectRestaurant: () => ['admin', 'rejectRestaurant'],
        suspendRestaurant: () => ['admin', 'suspendRestaurant'],
        activateRestaurant: () => ['admin', 'activateRestaurant'],
        verifyDeliveryPartner: () => ['admin', 'verifyDeliveryPartner'],
        suspendDeliveryPartner: () => ['admin', 'suspendDeliveryPartner'],
        moderateReview: () => ['admin', 'moderateReview'],
    }
};
