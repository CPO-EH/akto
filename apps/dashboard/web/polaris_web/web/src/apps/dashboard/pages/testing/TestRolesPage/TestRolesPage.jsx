import { useEffect, useState } from "react"
import PageWithMultipleCards from "../../../components/layouts/PageWithMultipleCards"
import GithubSimpleTable from "../../../components/tables/GithubSimpleTable"
import api from "../api"
import { Button, IndexFiltersMode } from "@shopify/polaris"
import { useNavigate } from "react-router-dom"
import func from "@/util/func"
import {
    ProfileMinor,
    CalendarMinor
  } from '@shopify/polaris-icons';
import EmptyScreensLayout from "../../../components/banners/EmptyScreensLayout"
import { ROLES_PAGE_DOCS_URL } from "../../../../main/onboardingData"
import { CellType } from "../../../components/tables/rows/GithubRow"
import TitleWithInfo from "../../../components/shared/TitleWithInfo"
import useTable from "../../../components/tables/TableContext"


const sortOptions = [
    { label: 'Created at', value: 'created asc', directionLabel: 'Highest', sortKey: 'createdTs', columnIndex: 2 },
    { label: 'Created at', value: 'created desc', directionLabel: 'Lowest', sortKey: 'createdTs', columnIndex: 2 },
];

const headers = [
    {
        title:"Test Role",
        text:"Name",
        value:"name",
    },
    {
        title:"Created",
        text:"Created at",
        value:"createdAt",
        sortKey:"createdTs",
        sortActive:true,
    },
    {
        title:"Author",
        text:"Created by",
        value:"createdBy",
    },
    {
        title: '',
        type: CellType.ACTION,
    }
]

let heading = JSON.parse(JSON.stringify(headers))

const resourceName = {
    singular: 'test role',
    plural: 'test roles',
};

function TestRolesPage(){

    const [loading, setLoading] = useState(false);
    const [showEmptyScreen, setShowEmptyScreen] = useState(false)
    const navigate = useNavigate()

    const [data, setData] = useState({ 'all': [], 'by_akto': [], 'custom': []})

    const handleRedirect = () => {
        navigate("details")
    }


    const getActions = (item) => {

        const actionItems = [{
            items: [
                {
                    content: 'Access matrix',
                    onAction: () => navigate("access-matrix", {state: {
                        name: item.name,
                        endpoints: item.endpointLogicalGroup.testingEndpoints,
                        authWithCondList: item.authWithCondList
                    }})
                }
            ]
        }]

        // if(item.name !== 'ATTACKER_TOKEN_ALL') {
        if(item.createdBy !== 'System') {
            const removeActionItem = {
                content: 'Remove',
                onAction: async () => {
                    await api.deleteTestRole(item.name)
                    setLoading(true)
                    fetchData()
                    func.setToast(true, false, "Test role has been deleted successfully.")
                },
                destructive: true
            }
            actionItems[0].items.push(removeActionItem)
        }

        return actionItems
    }

    async function fetchData(){
        await api.fetchTestRoles().then((res) => {
            setShowEmptyScreen(res.testRoles.length === 0)
            const all = [], akto = [], custom = []
            res.testRoles.forEach((testRole) => {
                testRole.timestamp = func.prettifyEpoch(testRole.lastUpdatedTs)
                testRole.id=testRole.name;
                testRole.createdAt = func.prettifyEpoch(testRole.createdTs)
                all.push(testRole)
                if(testRole.createdBy === 'System' || testRole.createdBy === 'AKTO') {
                    akto.push(testRole)
                } else {
                    custom.push(testRole)
                }
            })
            setData({ 'all': all, 'by_akto': akto, 'custom': custom})
            setLoading(false);
        })
    }
    const [selected, setSelected] = useState(0)
    const [selectedTab, setSelectedTab] = useState('all')
    const { tabsInfo } = useTable()
    const definedTableTabs = ['All', 'By Akto', 'Custom'];
    const tableCountObj = func.getTabsCount(definedTableTabs, data)
    const tableTabs = func.getTableTabsContent(definedTableTabs, tableCountObj, setSelectedTab, selectedTab, tabsInfo)


    useEffect(() => {
        setLoading(true);
        fetchData();
    }, [])

    const onTestRoleClick = (item) => navigate("details", {state: {
        name: item.name,
        endpoints: item.endpointLogicalGroup.testingEndpoints,
        authWithCondList: item.authWithCondList
    }})

    const handleSelectedTab = (selectedIndex) => {
        setSelected(selectedIndex)
    }

    return (
        <PageWithMultipleCards
            title={<TitleWithInfo
                titleText={"Test roles"}
                tooltipContent={"Test roles define specific access permissions and authentication methods for API security testing scenarios."}
            />}
        primaryAction = {<Button primary onClick={handleRedirect}><div data-testid="new_test_role_button">Create new test role</div></Button>}
        isFirstPage={true}
        components={[
            showEmptyScreen ? 
                <EmptyScreensLayout key={"emptyScreen"}
                    iconSrc={"/public/file_check.svg"}
                    headingText={"Define your Test Roles"}
                    description={"No test role to show yet. Create one now to test for role specific vulnerabilities such as BOLA or privilege escalation."}
                    buttonText={"Create test role"}
                    redirectUrl={"/dashboard/testing/roles/details"}
                    learnText={"Creating test roles"}
                    docsUrl={ROLES_PAGE_DOCS_URL}
                />

            
            :    <GithubSimpleTable
                    key="table"
                    selected={selected}
                    data={data[selectedTab]}
                    onSelect={handleSelectedTab}
                    mode={IndexFiltersMode.Default}
                    tableTabs={tableTabs}
                    resourceName={resourceName} 
                    headers={headers}
                    headings={heading}
                    loading={loading}
                    onRowClick={onTestRoleClick}
                    getActions={getActions}
                    hasRowActions={true}
                    useNewRow={true}
                    sortOptions={sortOptions}
                />
        ]}
        />
    )
}

export default TestRolesPage