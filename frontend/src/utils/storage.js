// Storage utility to manage local escrows and seed mock data since the backend doesn't support listing escrows

const MOCK_ESCROWS = [
  {
    id: 101,
    title: "Freelance Website Development",
    description: "Full-stack React & Spring Boot corporate site development with secure admin dashboard.",
    amount: 1500.00,
    platformFee: 45.00,
    lockedAmount: 1455.00,
    commissionRate: 0.03,
    status: "RELEASED",
    buyerId: 1,
    buyerName: "Umang Jain",
    sellerId: 2,
    sellerName: "Alice Dev",
    disputeReason: null,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 102,
    title: "Premium Logo Design UI/UX",
    description: "Custom branding assets, design system components, and vectorized files delivery.",
    amount: 350.00,
    platformFee: 10.50,
    lockedAmount: 339.50,
    commissionRate: 0.03,
    status: "FUNDED",
    buyerId: 1,
    buyerName: "Umang Jain",
    sellerId: 3,
    sellerName: "Bob Designer",
    disputeReason: null,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 103,
    title: "Database Performance Audit",
    description: "Optimize PostgreSQL queries, pessimistic locking execution, and index rebuilding.",
    amount: 800.00,
    platformFee: 24.00,
    lockedAmount: 776.00,
    commissionRate: 0.03,
    status: "DISPUTED",
    buyerId: 1,
    buyerName: "Umang Jain",
    sellerId: 4,
    sellerName: "Charlie DBA",
    disputeReason: "Structured dispute opened by BUYER: Deliverables did not match performance requirements.",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const getLocalEscrows = (userEmail) => {
  if (!userEmail) return [];
  const key = `tz_escrows_${userEmail}`;
  const data = localStorage.getItem(key);
  if (!data) {
    // Seed default mock escrows
    localStorage.setItem(key, JSON.stringify(MOCK_ESCROWS));
    return MOCK_ESCROWS;
  }
  return JSON.parse(data);
};

export const saveLocalEscrow = (userEmail, escrow) => {
  if (!userEmail || !escrow) return;
  const key = `tz_escrows_${userEmail}`;
  const escrows = getLocalEscrows(userEmail);
  // Prevent duplicate additions
  if (!escrows.some(e => e.id === escrow.id)) {
    escrows.unshift(escrow);
    localStorage.setItem(key, JSON.stringify(escrows));
  }
};

export const updateLocalEscrowStatus = (userEmail, escrowId, newStatus, additionalFields = {}) => {
  if (!userEmail || !escrowId) return;
  const key = `tz_escrows_${userEmail}`;
  const escrows = getLocalEscrows(userEmail);
  const index = escrows.findIndex(e => e.id === Number(escrowId));
  if (index !== -1) {
    escrows[index] = {
      ...escrows[index],
      status: newStatus,
      updatedAt: new Date().toISOString(),
      ...additionalFields
    };
    localStorage.setItem(key, JSON.stringify(escrows));
  }
};
