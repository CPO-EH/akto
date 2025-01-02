import React, { useCallback, useEffect, useState } from 'react'
import FlyLayout from '../../../components/layouts/FlyLayout'
import func from '@/util/func'
import transform from '../transform'
import SampleDataList from '../../../components/shared/SampleDataList'
import SampleData from '../../../components/shared/SampleData'
import LayoutWithTabs from '../../../components/layouts/LayoutWithTabs'
import { Badge, Box, Button, Divider, HorizontalStack, Icon, Popover, Text, VerticalStack, Link, Modal } from '@shopify/polaris'
import api from '../../observe/api'
import issuesApi from "../../issues/api"
import GridRows from '../../../components/shared/GridRows'
import { useNavigate } from 'react-router-dom'
import TitleWithInfo from '@/apps/dashboard/components/shared/TitleWithInfo'
import "./style.css"
import ActivityTracker from '../../dashboard/components/ActivityTracker'
import observeFunc from "../../observe/transform.js"
import settingFunctions from '../../settings/module.js'
import JiraTicketCreationModal from '../../../components/shared/JiraTicketCreationModal.jsx'

function TestRunResultFlyout(props) {


    const { selectedTestRunResult, loading, issueDetails ,getDescriptionText, infoState, createJiraTicket, jiraIssueUrl, showDetails, setShowDetails, isIssuePage} = props
    const [fullDescription, setFullDescription] = useState(false)
    const [rowItems, setRowItems] = useState([])
    const [popoverActive, setPopoverActive] = useState(false)
    const [modalActive, setModalActive] = useState(false)
    const [jiraProjectMaps,setJiraProjectMap] = useState({})
    const [issueType, setIssueType] = useState('');
    const [projId, setProjId] = useState('')
    // modify testing run result and headers
    const infoStateFlyout = infoState && infoState.length > 0 ? infoState.filter((item) => item.title !== 'Jira') : []
    const fetchApiInfo = useCallback( async(apiInfoKey) => {
        let apiInfo = {}
        if(apiInfoKey !== null){
            await api.fetchEndpoint(apiInfoKey).then((res) => {
                apiInfo = JSON.parse(JSON.stringify(res))
            })
            let sensitiveParam = ""
            const sensitiveParamsSet = new Set();
            await api.loadSensitiveParameters(apiInfoKey.apiCollectionId,apiInfoKey.url, apiInfoKey.method).then((resp) => {
                resp?.data?.endpoints.forEach((x, index) => {
                    sensitiveParamsSet.add(x.subTypeString.toUpperCase())
                })
                const unique = sensitiveParamsSet.size
                let index = 0;
                sensitiveParamsSet.forEach((x) =>{
                    sensitiveParam += x;
                    if(index !== unique - 1){
                        sensitiveParam += ", "
                    }
                    index++
                })
            })
            setRowItems(transform.getRowInfo(issueDetails.severity,apiInfo,issueDetails.jiraIssueUrl,sensitiveParam,issueDetails.testRunIssueStatus === 'IGNORED'))
        }
    },[issueDetails])

    const navigate = useNavigate()

    useEffect(() => {
       if(issueDetails && Object.keys(issueDetails).length > 0){       
            fetchApiInfo(issueDetails.id.apiInfoKey)
       }
    },[issueDetails?.id?.apiInfoKey])

    function ignoreAction(ignoreReason){
        const severity = (selectedTestRunResult && selectedTestRunResult.vulnerable) ? issueDetails.severity : "";
        issuesApi.bulkUpdateIssueStatus([issueDetails.id], "IGNORED", ignoreReason, {[selectedTestRunResult.id]: severity.toUpperCase()} ).then((res) => {
            func.setToast(true, false, `Issue ignored`)
        })
    }

    function reopenAction(){
        issuesApi.bulkUpdateIssueStatus([issueDetails.id], "OPEN", "" ).then((res) => {
            func.setToast(true, false, "Issue re-opened")
        })
    }

    const handleJiraClick = async() => {
        if(!modalActive){
            const jirIntegration = await settingFunctions.fetchJiraIntegration()
            if(jirIntegration.projectIdsMap !== null && Object.keys(jirIntegration.projectIdsMap).length > 0){
                setJiraProjectMap(jirIntegration.projectIdsMap)
                if(Object.keys(jirIntegration.projectIdsMap).length > 0){
                    setProjId(Object.keys(jirIntegration.projectIdsMap)[0])
                }
            }else{
                setProjId(jirIntegration.projId)
                setIssueType(jirIntegration.issueType)
            }
        }
        setModalActive(!modalActive)
    }

    const handleSaveAction = (id) => {
        if(projId.length > 0 && issueType.length > 0){
            createJiraTicket(id, projId, issueType)
            setModalActive(false)
        }else{
            func.setToast(true, true, "Invalid project id or issue type")
        }
    }
    
    const issues = [{
        content: 'False positive',
        onAction: () => { ignoreAction("False positive") }
    },
    {
        content: 'Acceptable risk',
        onAction: () => { ignoreAction("Acceptable risk") }
    },
    {
        content: 'No time to fix',
        onAction: () => { ignoreAction("No time to fix") }
    }]

    const  reopen =  [{
        content: 'Reopen',
        onAction: () => { reopenAction() }
    }]

    const handleClose = () => {
        const navigateUrl = isIssuePage ? "/dashboard/issues" : window.location.pathname.split("result")[0]
        navigate(navigateUrl) 
    }

    const openTest = () => {
        const navUrl = window.location.origin + "/dashboard/test-editor/" + selectedTestRunResult.testCategoryId
        window.open(navUrl, "_blank")
    }

    function ActionsComp (){
        const issuesActions = issueDetails?.testRunIssueStatus === "IGNORED" ? [...issues, ...reopen] : issues
        return(
            issueDetails?.id &&
        <Popover
            activator={<Button disclosure onClick={() => setPopoverActive(!popoverActive)}>Triage</Button>}
            active={popoverActive}
            onClose={() => setPopoverActive(false)}
            autofocusTarget="first-node"
            preferredPosition="below"
            preferredAlignment="left"
        >
            <Popover.Pane fixed>
                <Popover.Section>
                    <VerticalStack gap={"4"}>
                        {issuesActions.map((issue, index) => {
                            return(
                                <div style={{cursor: 'pointer'}} onClick={() => {issue.onAction(); setPopoverActive(false)}} key={index}>
                                    {issue.content}
                                </div>
                            )
                        })}
                    </VerticalStack>
                </Popover.Section>
            </Popover.Pane>
        </Popover>
    )}
    function TitleComponent() {
        const severity = (selectedTestRunResult && selectedTestRunResult.vulnerable) ? issueDetails.severity : ""
        return(
            <div style={{display: 'flex', justifyContent: "space-between", gap:"24px", padding: "16px", paddingTop: '0px'}}>
                <VerticalStack gap={"2"}>
                    <Box width="100%">
                        <div style={{display: 'flex', gap: '4px'}} className='test-title'>
                            <Button removeUnderline plain monochrome onClick={() => openTest()}>
                                <Text variant="headingSm" alignment="start" breakWord>{selectedTestRunResult?.name}</Text>
                            </Button>
                            {(severity && severity?.length > 0) ? (issueDetails?.testRunIssueStatus === 'IGNORED' ? <Badge size='small'>Ignored</Badge> : <Box className={`badge-wrapper-${severity.toUpperCase()}`}><Badge size="small" status={observeFunc.getColor(severity)}>{severity}</Badge></Box>) : null}
                        </div>
                    </Box>
                    <HorizontalStack gap={"2"}>
                        <Text color="subdued" variant="bodySm">{transform.getTestingRunResultUrl(selectedTestRunResult)}</Text>
                        <Box width="1px" borderColor="border-subdued" borderInlineStartWidth="1" minHeight='16px'/>
                        <Text color="subdued" variant="bodySm">{selectedTestRunResult?.testCategory}</Text>
                    </HorizontalStack>
                </VerticalStack>
                <HorizontalStack gap={2} wrap={false}>
                    <ActionsComp />

                    {selectedTestRunResult && selectedTestRunResult.vulnerable && 
                        <JiraTicketCreationModal
                            activator={<Button id={"create-jira-ticket-button"} primary onClick={handleJiraClick} disabled={jiraIssueUrl !== "" || window.JIRA_INTEGRATED !== "true"}>Create Jira Ticket</Button>}
                            modalActive={modalActive}
                            setModalActive={setModalActive}
                            handleSaveAction={handleSaveAction}
                            jiraProjectMaps={jiraProjectMaps}
                            setProjId={setProjId}
                            setIssueType={setIssueType}
                            projId={projId}
                            issueType={issueType}
                            issueId={issueDetails.id}
                        />
                    }
                </HorizontalStack>
            </div>
        )
    }

    const dataExpiredComponent = <Box paddingBlockStart={3} paddingInlineEnd={4} paddingInlineStart={4}>
        <Text>
            Sample data might not be available for non-vulnerable tests more than 2 months ago.
            <br/>
            Please contact <Link url="mailto:support@akto.io">support@akto.io</Link> for more information.
        </Text>
    </Box>

    const dataStoreTime = 2 * 30 * 24 * 60 * 60;
    const dataExpired = func.timeNow() - (selectedTestRunResult?.endTimestamp || func.timeNow()) > dataStoreTime

    const ValuesTab = {
        id: 'values',
        content: "Values",
        component: (dataExpired && !selectedTestRunResult?.vulnerable && 
            !(selectedTestRunResult?.testResults?.[0]?.originalMessage || selectedTestRunResult?.testResults?.[0]?.message) )
            ? dataExpiredComponent :
            (func.showTestSampleData(selectedTestRunResult) && selectedTestRunResult.testResults &&
        <Box paddingBlockStart={3} paddingInlineEnd={4} paddingInlineStart={4}><SampleDataList
            key="Sample values"
            heading={"Attempt"}
            minHeight={"30vh"}
            vertical={true}
            sampleData={selectedTestRunResult?.testResults.map((result) => {
                return {originalMessage: result.originalMessage, message:result.message, highlightPaths:[]}
            })}
            isNewDiff={true}
            vulnerable={selectedTestRunResult?.vulnerable}
            isVulnerable={selectedTestRunResult.vulnerable}
        />
        </Box>)
    }
    const moreInfoComponent = (
        infoStateFlyout.length > 0 ?
        <VerticalStack gap={"5"}>
            {infoStateFlyout.map((item, index) => {
                return(
                    <VerticalStack gap={"5"} key={index}>
                        <VerticalStack gap={"2"} >
                            <HorizontalStack gap="1_5-experimental">
                                <Box><Icon source={item.icon} color='subdued'/></Box>
                                <TitleWithInfo
                                    textProps={{variant:"bodyMd", fontWeight:"semibold", color:"subdued"}}
                                    titleText={item.title}
                                    tooltipContent={item.tooltipContent}
                                />
                            </HorizontalStack>
                            {item?.content}
                        </VerticalStack>
                        {index !== infoStateFlyout.length - 1 ? <Divider /> : null}
                    </VerticalStack>
                )
            })}
        </VerticalStack>
        : null
    )

    function RowComp ({cardObj}){
        const {title, value, tooltipContent} = cardObj
        return(
            value ? <Box width="224px">
                <VerticalStack gap={"2"}>
                    <TitleWithInfo
                        textProps={{variant:"bodyMd", fontWeight:"semibold"}}
                        titleText={title}
                        tooltipContent={tooltipContent}
                    />
                    {value}
                </VerticalStack>
            </Box>: null
        )
    }

    const testResultDetailsComp = (
        <GridRows columns={3} items={rowItems} CardComponent={RowComp} />
    )

    const overviewComp = (
        <Box padding={"4"}>
            <VerticalStack gap={"5"}>
                <VerticalStack gap={"2"}>
                    <TitleWithInfo
                        textProps={{variant:"bodyMd", fontWeight:"semibold", color:"subdued"}}
                        titleText={"Description"}
                        tooltipContent={"A brief description about the test from test library"}
                    />
                    <Box as="span">
                        {
                            getDescriptionText(fullDescription) 
                        }
                        <Button plain onClick={() => setFullDescription(!fullDescription)}> {fullDescription ? "Less" : "More"} information</Button>
                    </Box>
                </VerticalStack>
                <Divider />
                {testResultDetailsComp}
                <Divider />
                {moreInfoComponent}  
            </VerticalStack>
        </Box>
    )
    const overviewTab = {
        id: "overview",
        content: 'Overview',
        component: issueDetails.id && overviewComp
    }

    const generateActivityEvents = (issue) => {
        const activityEvents = []

        const createdEvent = {
            description: 'Found the issue',
            timestamp: issue.creationTime,
        }
        activityEvents.push(createdEvent)

        if (issue.testRunIssueStatus === 'IGNORED') {
            const ignoredEvent = {
                description: <Text>Issue marked as <b>IGNORED</b> - {issue.ignoreReason || 'No reason provided'}</Text>,
                timestamp: issue.lastUpdated,
            }
            activityEvents.push(ignoredEvent)
        }

        if (issue.testRunIssueStatus === 'FIXED') {
            const fixedEvent = {
                description: <Text>Issue marked as <b>FIXED</b></Text>,
                timestamp: issue.lastUpdated,
            }
            activityEvents.push(fixedEvent)
        }

        return activityEvents
    }
    const latestActivity = generateActivityEvents(issueDetails).reverse()

    const timelineTab = (selectedTestRunResult && selectedTestRunResult.vulnerable) && {
        id: "timeline",
        content: "Timeline",
        component: <ActivityTracker latestActivity={latestActivity} />
    }

    const errorTab = {
        id: "error",
        content: "Attempt",
        component:  ( selectedTestRunResult.errors && selectedTestRunResult.errors.length > 0 ) && <Box padding={"4"}>
            {
            selectedTestRunResult?.errors?.map((error, i) => {
                if (error) {
                    let data = {
                        original : error
                    }
                    return (
                        <SampleData key={i} data={data} language="yaml" minHeight="450px" wordWrap={false}/>
                        // <p className="p-class" key={i}>{error}</p>
                      )
                }
            })
          }
        </Box>
    }

    const attemptTab =  ( selectedTestRunResult.errors && selectedTestRunResult.errors.length > 0 ) ? errorTab : ValuesTab

    const tabsComponent = (
        <LayoutWithTabs
            key={issueDetails?.id}
            tabs={issueDetails?.id ? [overviewTab,timelineTab,ValuesTab]: [attemptTab]}
            currTab = {() => {}}
        />
    )

    const currentComponents = [
        <TitleComponent/>, tabsComponent
    ]

    const title = isIssuePage ? "Issue details" : "Test result"

    return (
        <FlyLayout
            title={title}
            show={showDetails}
            setShow={setShowDetails}
            components={currentComponents}
            loading={loading}
            showDivider={true}
            newComp={true}
            handleClose={handleClose}
            isHandleClose={true}
        />
    )
}

export default TestRunResultFlyout