namespace backend.DTOs
{
    public class DashboardRevenueDto
    {
        public string Date { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
    }

    public class DashboardActivityDto
    {
        public string Id { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Timestamp { get; set; } = string.Empty;
        public string User { get; set; } = string.Empty;
        public string? Value { get; set; }
    }

    public class DashboardStatsDto
    {
        public decimal TotalRevenue { get; set; }
        public int TotalOrders { get; set; }
        public int TotalCustomers { get; set; }
        public int TotalStaff { get; set; }
        public decimal RevenueGrowth { get; set; }
        public decimal OrdersGrowth { get; set; }
        public decimal CustomersGrowth { get; set; }
        public decimal StaffGrowth { get; set; }
    }
}