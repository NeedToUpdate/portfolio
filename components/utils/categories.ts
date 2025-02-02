import { ChartBarIcon, CurrencyDollarIcon, DatabaseIcon, ServerIcon } from "../icons/categoryIcons";


export const category_lookup: Record<string, { icon: (props: { className?: string | undefined; }) => JSX.Element, name: string }> = {
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