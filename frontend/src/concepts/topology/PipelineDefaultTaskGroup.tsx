import * as React from 'react';

import {
  WithSelectionProps,
  isNode,
  DefaultTaskGroup,
  observer,
  Node,
  GraphElement,
  RunStatus,
  ScaleDetailsLevel,
  NodeModel,
  useHover,
  PipelineNodeModel,
  TaskGroupPillLabel,
  LabelPosition,
  SELECTION_EVENT,
  useVisualizationController,
  action,
  addSpacerNodes,
  DEFAULT_SPACER_NODE_TYPE,
  Dimensions,
  getEdgesFromNodes,
} from '@patternfly/react-topology';
import { Button, Flex, FlexItem, Popover, Stack, StackItem } from '@patternfly/react-core';
import { BanIcon } from '@patternfly/react-icons';
import { PipelineNodeModelExpanded, StandardTaskNodeData } from '#~/concepts/topology/types';
import NodeStatusIcon from '#~/concepts/topology/NodeStatusIcon';
import { ExecutionStateKF } from '#~/concepts/pipelines/kfTypes';
import { getRunStatusLabel } from '#~/concepts/topology/utils';
import { isHiddenByCollapsedAncestor } from '#~/concepts/topology/a11yUtils';
import { NODE_HEIGHT, NODE_WIDTH } from './const';

const MAX_TIP_ITEMS = 6;

type PipelinesDefaultGroupProps = {
  element: GraphElement<PipelineNodeModelExpanded>;
} & WithSelectionProps;

type PipelinesDefaultGroupInnerProps = Omit<PipelinesDefaultGroupProps, 'element'> & {
  element: Node<PipelineNodeModel, StandardTaskNodeData>;
};

const DefaultTaskGroupInner: React.FunctionComponent<PipelinesDefaultGroupInnerProps> = observer(
  ({ element, selected, onSelect }) => {
    const controller = useVisualizationController();
    const [hover, hoverRef] = useHover<SVGGElement>();
    const [popoverOpen, setPopoverOpen] = React.useState(false);
    const visualGroupRef = React.useRef<SVGGElement>(null);
    const popoverRef = React.useRef<HTMLButtonElement>(null);
    const toggleRef = React.useRef<HTMLButtonElement>(null);
    const focusToggleAfterCollapse = React.useRef(false);
    const detailsLevel = element.getGraph().getDetailsLevel();
    const isCollapsed = element.isCollapsed();
    const isHidden = isHiddenByCollapsedAncestor(element);
    const runStatus = element.getData()?.runStatus;
    const state = element.getData()?.pipelineTask.status?.state;

    React.useEffect(() => {
      if (!isCollapsed || isHidden) {
        setPopoverOpen(false);
      }
    }, [isCollapsed, isHidden]);

    React.useEffect(() => {
      if (focusToggleAfterCollapse.current) {
        toggleRef.current?.focus();
        focusToggleAfterCollapse.current = false;
      }
    }, [isCollapsed]);

    React.useLayoutEffect(() => {
      // PatternFly's truncated SVG label tooltip creates an extra Tab stop before our HTML controls.
      visualGroupRef.current
        ?.querySelectorAll<SVGTextElement>('.pf-topology-pipelines__pill-text')
        .forEach((label) => {
          label.setAttribute('tabindex', '-1');
          label.setAttribute('aria-hidden', 'true');
        });
    });

    const toggleCollapse = React.useCallback(() => {
      const graph = element.getGraph();
      const nextCollapsed = !element.isCollapsed();
      focusToggleAfterCollapse.current = true;
      action(() => {
        if (nextCollapsed) {
          element.setDimensions(new Dimensions(NODE_WIDTH, NODE_HEIGHT));
        }
        element.setCollapsed(nextCollapsed);

        const pipelineNodes = (controller.toModel().nodes ?? [])
          .filter((node) => node.type !== DEFAULT_SPACER_NODE_TYPE)
          .map((node) => ({ ...node, visible: true }));
        const renderNodes = addSpacerNodes(pipelineNodes);
        controller.fromModel({ nodes: renderNodes, edges: getEdgesFromNodes(renderNodes) }, true);
        graph.layout();
      })();

      if (nextCollapsed) {
        graph.fit(80);
        graph.centerInView(element);
      } else {
        graph.fit(80, element);
      }
    }, [controller, element]);

    const selectChild = React.useCallback(
      (childId: string) => {
        setPopoverOpen(false);
        controller.fireEvent(SELECTION_EVENT, [childId]);
      },
      [controller],
    );

    const getPopoverTasksList = (items: Node<NodeModel>[]) => (
      <Stack hasGutter>
        {items.slice(0, MAX_TIP_ITEMS).map((item: Node) => {
          const childStatus = getRunStatusLabel(item.getData()?.runStatus);
          const childLabel = item.getLabel();
          return (
            <StackItem key={item.getId()}>
              <Button
                variant="link"
                isInline
                onClick={() => selectChild(item.getId())}
                aria-label={
                  childStatus ? `${childLabel}, ${childStatus}` : `${childLabel}, View task details`
                }
                data-testid={`pipeline-group-task-${item.getId()}`}
              >
                <Flex gap={{ default: 'gapXs' }} alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem style={{ flex: '0', width: 26 }} aria-hidden="true">
                    <NodeStatusIcon runStatus={item.getData()?.runStatus} />
                  </FlexItem>
                  <FlexItem style={{ flex: '1', marginLeft: 4 }}>
                    {childLabel}
                    {childStatus ? ` (${childStatus})` : ''}
                  </FlexItem>
                </Flex>
              </Button>
            </StackItem>
          );
        })}
        {items.length > MAX_TIP_ITEMS ? (
          <StackItem>{`... ${items.length - MAX_TIP_ITEMS} others`}</StackItem>
        ) : null}
      </Stack>
    );

    const status = React.useMemo(() => {
      switch (state) {
        case ExecutionStateKF.CACHED:
          return RunStatus.Succeeded;
        case ExecutionStateKF.RUNNING:
          return RunStatus.InProgress;
        default:
          return runStatus;
      }
    }, [state, runStatus]);

    const childCount = element.getAllNodeChildren().length;
    const pipelineTask = element.getData()?.pipelineTask;
    const iterationCount =
      pipelineTask &&
      'iterationCount' in pipelineTask &&
      typeof pipelineTask.iterationCount === 'number'
        ? pipelineTask.iterationCount
        : undefined;
    const badgeText = iterationCount != null ? `x${iterationCount}` : undefined;
    const groupLabel = element.getLabel();
    const groupStatusLabel = getRunStatusLabel(status);
    const groupAriaLabel = groupStatusLabel
      ? `${groupLabel} task group, ${childCount} ${
          childCount === 1 ? 'task' : 'tasks'
        }, ${groupStatusLabel}`
      : `${groupLabel} task group, ${childCount} ${childCount === 1 ? 'task' : 'tasks'}`;
    const bounds = element.getBounds();

    const groupNode = (
      <DefaultTaskGroup
        element={element}
        collapsible
        recreateLayoutOnCollapseChange
        GroupLabelComponent={(props) => (
          <TaskGroupPillLabel
            {...props}
            badge={badgeText}
            customStatusIcon={status === RunStatus.Cancelled ? <BanIcon /> : undefined}
          />
        )}
        selected={selected}
        onSelect={onSelect}
        hideDetailsAtMedium
        centerLabelOnEdge
        labelPosition={LabelPosition.top}
        showStatusState
        scaleNode={hover && detailsLevel !== ScaleDetailsLevel.high}
        customStatusIcon={status === RunStatus.Cancelled ? <BanIcon /> : undefined}
        showLabelOnHover
        status={status}
        hiddenDetailsShownStatuses={[
          RunStatus.Succeeded,
          RunStatus.Pending,
          RunStatus.Failed,
          RunStatus.Cancelled,
        ]}
        collapsedHeight={NODE_HEIGHT}
        collapsedWidth={NODE_WIDTH}
      />
    );

    return (
      <g ref={hoverRef}>
        <g ref={visualGroupRef}>{groupNode}</g>
        {isCollapsed && !isHidden ? (
          <foreignObject
            x={0}
            y={0}
            width={Math.max(0, bounds.width - 12)}
            height={bounds.height}
            overflow="visible"
          >
            <Popover
              triggerAction="click"
              triggerRef={popoverRef}
              isVisible={popoverOpen}
              shouldClose={() => setPopoverOpen(false)}
              aria-label={groupAriaLabel}
              headerContent={groupLabel}
              bodyContent={getPopoverTasksList(element.getAllNodeChildren())}
            >
              <button
                ref={popoverRef}
                type="button"
                className="odh-pipeline-node-button m-group"
                aria-label={`Show tasks in ${groupAriaLabel}`}
                aria-expanded={popoverOpen}
                onClick={(event) => {
                  event.stopPropagation();
                  setPopoverOpen((open) => !open);
                }}
                data-pipeline-node-id={element.getId()}
                data-testid={`pipeline-group-button-${groupLabel}`}
              />
            </Popover>
          </foreignObject>
        ) : null}
        {!isHidden ? (
          <foreignObject
            x={isCollapsed ? bounds.width - 12 : bounds.x + bounds.width - 42.5}
            y={isCollapsed ? 0 : bounds.y - 13}
            width={28.25}
            height={isCollapsed ? bounds.height : 26}
            overflow="visible"
          >
            <button
              ref={toggleRef}
              type="button"
              className="odh-pipeline-node-button m-group"
              aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${groupLabel} task group`}
              aria-expanded={!isCollapsed}
              onClick={(event) => {
                event.stopPropagation();
                toggleCollapse();
              }}
              data-pipeline-node-id={element.getId()}
              data-testid={`pipeline-group-toggle-${groupLabel}`}
            />
          </foreignObject>
        ) : null}
      </g>
    );
  },
);

const PipelineDefaultTaskGroup: React.FunctionComponent<PipelinesDefaultGroupProps> = ({
  element,
  ...rest
}: PipelinesDefaultGroupProps & WithSelectionProps) => {
  if (!isNode(element)) {
    throw new Error('DefaultTaskGroup must be used only on Node elements');
  }

  return <DefaultTaskGroupInner element={element} {...rest} />;
};

export default observer(PipelineDefaultTaskGroup);
