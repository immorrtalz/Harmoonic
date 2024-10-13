$('html').on('mousedown', '.with-ripple', function(event)
{
	const element = $(event.target);
	var x = event.pageX - element.offset().left;
	var y = event.pageY - element.offset().top;

	var elm0 = $('<span/>').appendTo(element).css(
	{
		position: 'absolute',
		inset: '0'
	});

	var elm = $('<span/>').appendTo(elm0).css(
	{
		left: x + 'px',
		top: y + 'px'
	}).addClass('ripple');

	setTimeout(() =>
	{
		elm0.remove();
		elm.remove();
	}, 3000);
});