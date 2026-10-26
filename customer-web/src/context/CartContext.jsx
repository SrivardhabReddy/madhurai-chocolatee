import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('mc_cart');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      
      // Clean and normalize existing items from storage
      return parsed
        .map(item => {
          const id = item.product_id || item.id;
          if (!id) return null;
          const sPrice = parseFloat(item.selling_price) || parseFloat(item.price) || 0;
          const mrpVal = parseFloat(item.mrp) || sPrice;
          return {
            ...item,
            product_id: id,
            id: id,
            name: item.name || 'Madhurai Chocolate',
            slug: item.slug || '',
            image_url: item.image_url || '/uploads/chocolate-crunch-pb.jpg',
            quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
            selling_price: sPrice,
            price: sPrice,
            mrp: mrpVal,
            weight: item.weight || '500g',
            pieces_per_pack: item.pieces_per_pack || 40,
            selling_unit: item.selling_unit || 'BOX'
          };
        })
        .filter(Boolean);
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('mc_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem('mc_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [deliveryPincode, setDeliveryPincode] = useState(() => {
    try {
      return localStorage.getItem('mc_pincode') || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mc_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem('mc_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error('Failed to save wishlist to localStorage', e);
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem('mc_coupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('mc_coupon');
      }
    } catch (e) {
      console.error('Failed to save coupon to localStorage', e);
    }
  }, [appliedCoupon]);

  useEffect(() => {
    try {
      if (deliveryPincode) {
        localStorage.setItem('mc_pincode', deliveryPincode);
      } else {
        localStorage.removeItem('mc_pincode');
      }
    } catch (e) {
      console.error('Failed to save pincode to localStorage', e);
    }
  }, [deliveryPincode]);

  const addItem = (product, quantity = 1) => {
    if (!product) return;
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const pId = product.product_id !== undefined && product.product_id !== null 
      ? product.product_id 
      : product.id;
    if (!pId) return;

    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => 
        String(item.product_id || item.id) === String(pId) ||
        (product.slug && item.slug && item.slug === product.slug)
      );

      if (existingIndex > -1) {
        const next = [...prev];
        const currentQty = parseInt(next[existingIndex].quantity, 10) || 1;
        next[existingIndex] = {
          ...next[existingIndex],
          product_id: pId,
          id: pId,
          quantity: currentQty + qty
        };
        return next;
      } else {
        const primaryImg = product.primary_image?.image_url || 
          product.image_url || 
          product.images?.[0]?.image_url || 
          '/uploads/chocolate-crunch-pb.jpg';
        const sPrice = parseFloat(product.selling_price) || parseFloat(product.price) || 0;
        const mrpVal = parseFloat(product.mrp) || sPrice;

        return [
          ...prev,
          {
            product_id: pId,
            id: pId,
            name: product.name || 'Madhurai Chocolate',
            slug: product.slug || '',
            image_url: primaryImg,
            weight: product.weight || '500g',
            selling_unit: product.selling_unit || 'BOX',
            pieces_per_pack: product.pieces_per_pack || 40,
            mrp: mrpVal,
            selling_price: sPrice,
            price: sPrice,
            discount: product.discount || (mrpVal > sPrice ? Math.round(((mrpVal - sPrice) / mrpVal) * 100) : 0),
            quantity: qty
          }
        ];
      }
    });
  };

  const removeItem = (productId) => {
    if (productId === undefined || productId === null) return;
    setCartItems(prev => prev.filter(i => {
      const itemId = i.product_id !== undefined && i.product_id !== null ? i.product_id : i.id;
      return String(itemId) !== String(productId);
    }));
  };

  const updateQuantity = (productId, delta) => {
    if (productId === undefined || productId === null) return;
    setCartItems(prev => {
      return prev.map(item => {
        const itemId = item.product_id !== undefined && item.product_id !== null ? item.product_id : item.id;
        if (String(itemId) === String(productId)) {
          const newQty = (parseInt(item.quantity, 10) || 1) + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const setQuantity = (productId, newQuantity) => {
    if (productId === undefined || productId === null) return;
    const qty = parseInt(newQuantity, 10);
    setCartItems(prev => {
      if (qty <= 0) {
        return prev.filter(item => {
          const itemId = item.product_id !== undefined && item.product_id !== null ? item.product_id : item.id;
          return String(itemId) !== String(productId);
        });
      }
      return prev.map(item => {
        const itemId = item.product_id !== undefined && item.product_id !== null ? item.product_id : item.id;
        if (String(itemId) === String(productId)) {
          return { ...item, quantity: qty };
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
    try {
      localStorage.removeItem('mc_coupon');
    } catch (e) {}
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    try {
      localStorage.removeItem('mc_coupon');
    } catch (e) {}
  };

  const toggleWishlist = (product) => {
    if (!product) return;
    const pId = product.id || product.product_id;
    setWishlist(prev => {
      const exists = prev.some(p => String(p.id || p.product_id) === String(pId));
      if (exists) {
        return prev.filter(p => String(p.id || p.product_id) !== String(pId));
      } else {
        return [...prev, product];
      }
    });
  };

  const isWishlisted = (productId) => {
    if (productId === undefined || productId === null) return false;
    return wishlist.some(p => String(p.id || p.product_id) === String(productId));
  };

  const totalItems = cartItems.reduce((acc, item) => acc + (parseInt(item.quantity, 10) || 1), 0);
  const subtotal = cartItems.reduce((acc, item) => acc + ((parseFloat(item.selling_price) || parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 1)), 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalItems,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        setQuantity,
        clearCart,
        wishlist,
        toggleWishlist,
        isWishlisted,
        appliedCoupon,
        setAppliedCoupon,
        removeCoupon,
        deliveryPincode,
        setDeliveryPincode
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
