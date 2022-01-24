import React from 'react';
import FilterList from 'Shared/Filters/FilterList';
import FilterSelection from 'Shared/Filters/FilterSelection';
import SaveFilterButton from 'Shared/SaveFilterButton';
import { connect } from 'react-redux';
import { IconButton, Button } from 'UI';
import { edit } from 'Duck/search';

interface Props {
  appliedFilter: any;
  edit: typeof edit;
}
function SessionSearch(props) {
  const { appliedFilter } = props;

  const onAddFilter = (filter) => {
    filter.value = [""]
    const newFilters = appliedFilter.filter.filters.concat(filter);
    props.edit({
      ...appliedFilter,
      filter: {
        ...appliedFilter.filter,
        filters: newFilters,
      }
    });
  }

  const onUpdateFilter = (filterIndex, filter) => {
    const newFilters = appliedFilter.filter.filters.map((_filter, i) => {
      if (i === filterIndex) {
        return filter;
      } else {
        return _filter;
      }
    });

    props.edit({
      ...appliedFilter.toData(),
      filter: {
        ...appliedFilter.filter,
        filters: newFilters,
      }
    });
  }

  const onRemoveFilter = (filterIndex) => {
    const newFilters = appliedFilter.filter.filters.filter((_filter, i) => {
      return i !== filterIndex;
    });

    props.edit({
      ...appliedFilter,
      filter: {
        ...appliedFilter.filter,
        filters: newFilters,
      }
    });
  }

  return (
    <div className="border bg-white rounded mt-4">
      <div className="p-3">
        <FilterList
          filters={appliedFilter.filter.filters.toJS()}
          onUpdateFilter={onUpdateFilter}
          onRemoveFilter={onRemoveFilter}
        />
      </div>

      <div className="border-t px-3 py-2 flex items-center">
        <div>
          <FilterSelection
            filter={undefined}
            onFilterClick={onAddFilter}
          >
            <IconButton primaryText label="ADD STEP" icon="plus" />
          </FilterSelection>
        </div>
        <div className="ml-auto flex items-center">
          <SaveFilterButton />
          <Button>CLEAR STEPS</Button>
          <Button plain>SAVE FUNNEL</Button>
        </div>
      </div>
    </div>
  );
}

export default connect(state => ({
  appliedFilter: state.getIn([ 'search', 'instance' ]),
}), { edit })(SessionSearch);

// appliedFilter: state.getIn([ 'filters', 'appliedFilter' ]),