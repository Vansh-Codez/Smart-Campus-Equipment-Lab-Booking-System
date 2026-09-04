from typing import List, Dict, Any
from pydantic import BaseModel

class KPISummary(BaseModel):
    total_equipment: int
    active_bookings: int
    pending_requisitions: int
    overdue_count: int
    utilization_rate: float
    overdue_rate: float
    maintenance_count: int
    total_labs: int
    total_users: int

class MostBookedItem(BaseModel):
    equipment_id: int
    equipment_name: str
    category: str
    booking_count: int

class PeakHourSlot(BaseModel):
    hour: str
    count: int

class OverdueTrendItem(BaseModel):
    period: str
    overdue: int
    returned_on_time: int

class CategoryUtilization(BaseModel):
    category: str
    total: int
    in_use: int
    utilization: float

class AnalyticsDashboard(BaseModel):
    kpis: KPISummary
    most_booked: List[MostBookedItem]
    peak_hours: List[PeakHourSlot]
    overdue_trends: List[OverdueTrendItem]
    category_utilization: List[CategoryUtilization]
