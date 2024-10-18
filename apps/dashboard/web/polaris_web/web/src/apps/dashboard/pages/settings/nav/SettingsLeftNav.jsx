import { Navigation } from "@shopify/polaris"
import { StoreDetailsFilledMinor, IdentityCardFilledMajor, AutomationFilledMajor, AppsFilledMajor} from "@shopify/polaris-icons"
import { ListFilledMajor, ReportFilledMinor, LockFilledMajor, CollectionsFilledMajor, PlanMajor, ChatMajor} from "@shopify/polaris-icons"
import { VariantMajor, VocabularyMajor, AdjustMinor } from "@shopify/polaris-icons"
import { useLocation, useNavigate } from "react-router-dom"
import func from "@/util/func"

const SettingsLeftNav = () => {
    const navigate = useNavigate()
    
    const location = useLocation()
    const path = location.pathname
    const page = path.substring(path.lastIndexOf('/') + 1)

    const usersArr = window.USER_ROLE !== 'GUEST' ? [{
        label: 'Users',
        icon: IdentityCardFilledMajor,
        selected: page === "users",
        onClick: () => navigate("/dashboard/settings/users")
    }] : []
    const logsArr = window?.IS_SAAS !== 'true' ||
        (window?.USER_NAME && window?.USER_NAME.includes("akto")) ? [{
            label: 'Logs',
            icon: ListFilledMajor,
            selected: page === "logs",
            onClick: () => navigate("/dashboard/settings/logs")
        }] : []
    const metricsArr = window.IS_SAAS === 'true' ? [] : [{
        label: 'Metrics',
        icon: ReportFilledMinor,
        selected: page === "metrics",
        onClick: () => navigate("/dashboard/settings/metrics")
    }]
    const selfHostedArr = window.IS_SAAS === 'true' ? [{
        label: 'Self hosted',
        icon: PlanMajor,
        selected: page === "self-hosted",
        onClick: () => navigate("/dashboard/settings/self-hosted")
    }] : []

    const billingArr = window.IS_SAAS === 'true' || window.DASHBOARD_MODE === 'ON_PREM' ? [{
        label: 'Billing',
        icon: PlanMajor,
        selected: page === "billing",
        onClick: () => navigate("/dashboard/settings/billing")
     }] : [];

    const cicdArr = !func.checkLocal() ? [{
        label: 'CI/CD',
        icon: AutomationFilledMajor,
        selected: page === "ci-cd",
        onClick: () => navigate("/dashboard/settings/integrations/ci-cd")
    }] : [];

    return (
        <Navigation>
            <Navigation.Section
                items={[
                    {
                        label: 'About',
                        icon: StoreDetailsFilledMinor,
                        selected: page === "about",
                        onClick: () => navigate("/dashboard/settings/about")
                    },
                    ...usersArr,
                    // {
                    //     label: 'Alerts',
                    //     icon: DiamondAlertMinor,
                    //     selected: page === "alerts",
                    //     onClick: () => navigate("/dashboard/settings")
                    // },
                    ...cicdArr,
                    {
                        label: 'Integrations',
                        icon: AppsFilledMajor,
                        selected: page === "integrations",
                        onClick: () => navigate("/dashboard/settings/integrations")
                    },
                    
                    ...logsArr,
                    ...metricsArr,
                    {
                        label: 'Auth types',
                        icon: LockFilledMajor,
                        selected: page === "auth-types",
                        onClick: () => navigate("/dashboard/settings/auth-types")
                    },
                    {
                        label: 'Default payloads',
                        icon: VariantMajor,
                        selected: page === "default-payloads",
                        onClick: () => navigate("/dashboard/settings/default-payloads")
                    },
                    {
                        label: 'Advanced traffic filters',
                        icon: AdjustMinor,
                        selected: page === "advanced-filters",
                        onClick: () => navigate("/dashboard/settings/advanced-filters")
                    }, 
                    {
                        label: 'Tags',
                        icon: CollectionsFilledMajor,
                        selected: page === "tags",
                        onClick: () => navigate("/dashboard/settings/tags")
                    },
                    {
                        label: 'Test library',
                        icon: VocabularyMajor,
                        selected: page === "test-library",
                        onClick: () => navigate("/dashboard/settings/test-library")
                    },
                    ...billingArr,
                    ...selfHostedArr,
                    {
                        label: 'Help & Support',
                        icon: ChatMajor,
                        selected: page === "help",
                        onClick: () => navigate("/dashboard/settings/help")
                    }
                ]}
            />
        </Navigation>
    )
}

export default SettingsLeftNav