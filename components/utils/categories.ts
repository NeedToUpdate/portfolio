import { ChartBarIcon, CurrencyDollarIcon, DatabaseIcon, ServerIcon } from "../icons/categoryIcons";

type Category = {
    icon: typeof ChartBarIcon,
    name: string
};

export const category_lookup: Record<string, Category> = {
    "reporting": {
        icon: ChartBarIcon,
        name: "Reporting & Analytics"
    },
    "infrastructure": {
        icon: ServerIcon,
        name: "Enterprise Infrastructure"
    },
    "data": {
        icon: DatabaseIcon,
        name: "Data Warehousing"
    },
    "payments": {
        icon: CurrencyDollarIcon,
        name: "Payments & Billing"
    }
}
