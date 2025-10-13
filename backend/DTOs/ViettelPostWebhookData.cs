public class ViettelPostWebhookData
{
    public ViettelPostOrderData? DATA { get; set; }
    public string? TOKEN { get; set; }
}

public class ViettelPostOrderData
{
    public string? ORDER_NUMBER { get; set; }
    public string? ORDER_REFERENCE { get; set; }
    public string? ORDER_STATUSDATE { get; set; }
    public int ORDER_STATUS { get; set; }
    public string? STATUS_NAME { get; set; }
    public string? LOCALION_CURRENTLY { get; set; }
    public string? NOTE { get; set; }
    public decimal MONEY_COLLECTION { get; set; }
    public decimal MONEY_FEECOD { get; set; }
    public decimal MONEY_TOTAL { get; set; }
    public string? EXPECTED_DELIVERY { get; set; }
    public decimal PRODUCT_WEIGHT { get; set; }
    public string? ORDER_SERVICE { get; set; }
}