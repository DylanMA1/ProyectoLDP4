import supabase from '../services/supabaseClient';

export const getSeats = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, zones (id, name, seats (id, reserved, sold))');
  
    if (error) {
      console.error('Error fetching seats:', error);
      return [];
    }
  
    return data.map(category => ({
      id: category.id,
      name: category.name,
      zones: category.zones.map(zone => ({
        id: zone.id,
        name: zone.name,
        seats: zone.seats.map(seat => ({
          id: seat.id,
          reserved: seat.reserved,
          sold: seat.sold
        }))
      }))
    }));
  };  
  

export const checkAvailability = async (category: string, quantity = 1) => {

    const { data: categoryData, error } = await supabase
        .from('categories')
        .select('id, zones (id, name, seats (reserved, sold))')
        .eq('name', category)
        .single();

    if (error || !categoryData) {
        console.error('Category not found:', error);
        return [];
    }

    const zonesWithAvailability = categoryData.zones
        .map(zone => {
            const availableSeats = zone.seats.filter(seat => !seat.reserved && !seat.sold).length;
            return {
                zone: zone.name,
                available_seats: availableSeats,
            };
        })
        .filter(zone => zone.available_seats >= quantity)
        .sort((a, b) => a.available_seats - b.available_seats)

    return zonesWithAvailability.slice(0, 3);
};


  export const reserveSeats = async (category: any, zone: any, quantity = 1) => {
    const { data: zoneData, error } = await supabase
      .from('zones')
      .select('id, seats (id, reserved, sold)')
      .eq('name', zone)
      .single();
  
    if (error || !zoneData) {
      console.error('Zone not found:', error);
      return { error: 'Zona no encontrada' };
    }
  
    const availableSeats = zoneData.seats.filter(seat => !seat.reserved && !seat.sold);
  
    if (availableSeats.length < quantity) {
      return { error: 'No hay suficientes asientos disponibles' };
    }
  
    // Reservamos los asientos
    const seatsToReserve = availableSeats.slice(0, quantity);
    for (let seat of seatsToReserve) {
      await supabase
        .from('seats')
        .update({ reserved: true })
        .eq('id', seat.id);
    }
  
    return { status: 'reserved', reserved_seats: quantity };
  };

  export const purchaseSeats = async (category: any, zone: any, quantity = 1) => {
    const { data: zoneData, error } = await supabase
      .from('zones')
      .select('id, seats (id, reserved, sold)')
      .eq('name', zone)
      .single();
  
    if (error || !zoneData) {
      console.error('Zone not found:', error);
      return { error: 'Zona no encontrada' };
    }
  
    const reservedSeats = zoneData.seats.filter(seat => seat.reserved);
  
    if (reservedSeats.length < quantity) {
      return { error: 'Reservas insuficientes' };
    }
  
    // Compramos los asientos
    const seatsToBuy = reservedSeats.slice(0, quantity);
    for (let seat of seatsToBuy) {
      await supabase
        .from('seats')
        .update({ sold: true, reserved: false })
        .eq('id', seat.id);
    }
  
    return { status: 'purchased', purchased_seats: quantity };
  };

  export const cancelReservation = async (category: any, zone: any, quantity = 1) => {
    const { data: zoneData, error } = await supabase
      .from('zones')
      .select('id, seats (id, reserved, sold)')
      .eq('name', zone)
      .single();
  
    if (error || !zoneData) {
      console.error('Zone not found:', error);
      return { error: 'Zona no encontrada' };
    }
  
    const reservedSeats = zoneData.seats.filter(seat => seat.reserved);
  
    if (reservedSeats.length < quantity) {
      return { error: 'No hay suficientes asientos reservados' };
    }
  
    // Cancelamos la reserva
    const seatsToCancel = reservedSeats.slice(0, quantity);
    for (let seat of seatsToCancel) {
      await supabase
        .from('seats')
        .update({ reserved: false })
        .eq('id', seat.id);
    }
  
    return { status: 'reservation canceled', canceled_seats: quantity };
  };

  // simulatePayment.js
export const simulatePayment = (cardInfo: any) => {
    if (!cardInfo) {
      return { error: 'Falta información de pago' };
    }
  
    const approved = Math.random() < 0.5; // Simulación de aprobación
    return { status: approved ? 'approved' : 'declined' };
  };
  