import {
  DEFAULT_TASK_NODE_TYPE,
  pipelineElementFactory,
  Visualization,
} from '@patternfly/react-topology';
import { orderNodesForKeyboard } from '#~/concepts/topology/a11yUtils';

describe('orderNodesForKeyboard', () => {
  it('places graph nodes and group children in visual reading order', () => {
    const controller = new Visualization();
    controller.registerElementFactory(pipelineElementFactory);
    controller.fromModel(
      {
        graph: { id: 'graph', type: 'graph' },
        nodes: [
          { id: 'last', type: DEFAULT_TASK_NODE_TYPE, x: 0, y: 200, width: 130, height: 35 },
          {
            id: 'group',
            type: DEFAULT_TASK_NODE_TYPE,
            x: 0,
            y: 100,
            width: 130,
            height: 100,
            group: true,
            children: ['child-last', 'child-first'],
          },
          { id: 'child-last', type: DEFAULT_TASK_NODE_TYPE, x: 0, y: 60, width: 130, height: 35 },
          { id: 'first', type: DEFAULT_TASK_NODE_TYPE, x: 0, y: 0, width: 130, height: 35 },
          { id: 'child-first', type: DEFAULT_TASK_NODE_TYPE, x: 0, y: 0, width: 130, height: 35 },
        ],
      },
      false,
    );

    const graph = controller.getGraph();
    orderNodesForKeyboard(graph);

    expect(graph.getNodes().map((node) => node.getId())).toEqual(['first', 'group', 'last']);
    expect(
      controller
        .getNodeById('group')
        ?.getNodes()
        .map((node) => node.getId()),
    ).toEqual(['child-first', 'child-last']);
  });
});
